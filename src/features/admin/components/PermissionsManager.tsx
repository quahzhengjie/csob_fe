// =================================================================================
// FILE: src/features/admin/components/PermissionsManager.tsx
// =================================================================================
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Save, RefreshCw, Info, CheckCircle } from 'lucide-react';
import type { Role } from '@/types/entities';

interface PermissionsManagerProps {
    userRoles: Record<string, Role>;
    onPermissionChange: (roleName: string, permissionKey: string, value: boolean) => void;
    onSaveChanges?: (changes: Record<string, Record<string, boolean>>) => Promise<void>;
}

// A helper function to format permission keys into readable column headers
const formatPermissionKey = (key: string) => {
    return key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^can /, '')      // Remove "can " prefix
        .replace(/admin:/, 'Admin: ')
        .replace(/case:/, 'Case: ')
        .replace(/document:/, 'Doc: ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Group permissions by category
const getPermissionCategory = (key: string): string => {
    if (key.startsWith('admin:')) return 'Administration';
    if (key.startsWith('case:')) return 'Case Management';
    if (key.startsWith('document:')) return 'Document Management';
    return 'General';
};

export function PermissionsManager({ userRoles, onPermissionChange, onSaveChanges }: PermissionsManagerProps) {
    // Track both current state and original state
    const [currentPermissions, setCurrentPermissions] = useState<Record<string, Record<string, boolean>>>({});
    const [originalPermissions, setOriginalPermissions] = useState<Record<string, Record<string, boolean>>>({});
    const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({});
    const [savingChanges, setSavingChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize permissions from props
    useEffect(() => {
        const permissions: Record<string, Record<string, boolean>> = {};
        Object.entries(userRoles).forEach(([roleName, role]) => {
            permissions[roleName] = { ...role.permissions };
        });
        setCurrentPermissions(permissions);
        setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
    }, [userRoles]);

    // Dynamically get all unique permission keys from all roles to create the table columns
    const permissionsByCategory = useMemo(() => {
        const categoryMap = new Map<string, string[]>();
        
        Object.values(userRoles).forEach(role => {
            Object.keys(role.permissions).forEach(key => {
                const category = getPermissionCategory(key);
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                const keys = categoryMap.get(category)!;
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            });
        });

        // Sort keys within each category
        categoryMap.forEach(keys => keys.sort());
        
        return categoryMap;
    }, [userRoles]);

    const hasChanges = useMemo(() => {
        return JSON.stringify(currentPermissions) !== JSON.stringify(originalPermissions);
    }, [currentPermissions, originalPermissions]);

    const handlePermissionToggle = (roleName: string, permissionKey: string, value: boolean) => {
        setCurrentPermissions(prev => ({
            ...prev,
            [roleName]: {
                ...prev[roleName],
                [permissionKey]: value
            }
        }));

        // Track what's changed
        setPendingChanges(prev => ({
            ...prev,
            [roleName]: {
                ...prev[roleName],
                [permissionKey]: value
            }
        }));
    };

    const handleSaveChanges = async () => {
        setSavingChanges(true);
        setSaveSuccess(false);

        try {
            if (onSaveChanges) {
                // Send only the changes
                await onSaveChanges(pendingChanges);
            } else {
                // Fallback: call onPermissionChange for each change
                for (const [roleName, permissions] of Object.entries(pendingChanges)) {
                    for (const [permissionKey, value] of Object.entries(permissions)) {
                        onPermissionChange(roleName, permissionKey, value);
                    }
                }
            }

            // Update original state to match current
            setOriginalPermissions(JSON.parse(JSON.stringify(currentPermissions)));
            setPendingChanges({});
            setSaveSuccess(true);
            
            // Hide success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save permissions:', error);
            // Could show error toast here
        } finally {
            setSavingChanges(false);
        }
    };

    const handleResetChanges = () => {
        setCurrentPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setPendingChanges({});
    };

    return (
        <div className="space-y-6">
            {/* Header with action buttons */}
            <div className="flex justify-between items-center p-6 pb-0">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Role Permissions Matrix</h3>
                <div className="flex items-center gap-2">
                    {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                            <CheckCircle size={16} />
                            <span>Changes saved successfully</span>
                        </div>
                    )}
                    {hasChanges && (
                        <>
                            <button
                                onClick={handleResetChanges}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <RefreshCw size={16} />
                                Reset Changes
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={savingChanges}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} />
                                {savingChanges ? 'Saving...' : `Save Changes (${Object.keys(pendingChanges).length} roles)`}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Permission Tables by Category */}
            {Array.from(permissionsByCategory.entries()).map(([category, permissions]) => (
                <div key={category} className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-700 dark:text-slate-300">{category}</h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300 sticky left-0 z-10 bg-gray-50 dark:bg-slate-900/50">
                                        Role
                                    </th>
                                    {permissions.map(key => (
                                        <th key={key} className="p-4 text-center font-semibold min-w-[120px]">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                                                    {formatPermissionKey(key)}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {Object.entries(userRoles).map(([roleName, roleData]) => {
                                    const rolePermissions = currentPermissions[roleName] || {};
                                    const hasRoleChanges = pendingChanges[roleName] !== undefined;
                                    
                                    return (
                                        <tr key={roleName} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${hasRoleChanges ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="p-4 font-medium sticky left-0 z-10 bg-white dark:bg-slate-800">
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">
                                                        {roleData.label}
                                                        {hasRoleChanges && (
                                                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">• modified</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {roleName}
                                                    </div>
                                                </div>
                                            </td>
                                            {permissions.map(permissionKey => {
                                                const isChecked = rolePermissions[permissionKey] ?? false;
                                                const isModified = pendingChanges[roleName]?.[permissionKey] !== undefined;
                                                
                                                return (
                                                    <td key={permissionKey} className="p-4 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={isChecked}
                                                                onChange={(e) => handlePermissionToggle(roleName, permissionKey, e.target.checked)}
                                                            />
                                                            <div className={`w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 ${isModified ? 'ring-2 ring-blue-500' : ''}`}></div>
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Info notice */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">About Permissions</p>
                    <p>
                        Toggle permissions for each role and click Save Changes to apply them. 
                        Changes will affect all users with the modified roles immediately upon saving.
                        Use Reset Changes to discard any unsaved modifications.
                    </p>
                </div>
            </div>
        </div>
    );
}