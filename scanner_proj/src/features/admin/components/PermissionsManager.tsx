// =================================================================================
// FILE: src/features/admin/components/PermissionsManager.tsx
// =================================================================================
'use client';

import React, { useMemo } from 'react';
import type { Role } from '@/types/enums';

interface PermissionsManagerProps {
    userRoles: Record<string, Role>;
    onPermissionChange: (roleName: string, permissionKey: string, value: boolean) => void;
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

export function PermissionsManager({ userRoles, onPermissionChange }: PermissionsManagerProps) {
    // Dynamically get all unique permission keys from all roles to create the table columns
    const allPermissionKeys = useMemo(() => {
        const keys = new Set<string>();
        Object.values(userRoles).forEach(role => {
            Object.keys(role.permissions).forEach(key => keys.add(key));
        });
        return Array.from(keys).sort();
    }, [userRoles]);

    return (
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Role Permissions</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th className="p-3 text-left font-semibold sticky left-0 z-10 bg-inherit">Role</th>
                            {allPermissionKeys.map(key => (
                                <th key={key} className="p-3 text-center font-semibold">
                                    <span className="inline-block -rotate-45">{formatPermissionKey(key)}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {Object.entries(userRoles).map(([roleName, roleData]) => (
                            <tr key={roleName}>
                                <td className="p-3 font-medium sticky left-0 z-10 bg-white dark:bg-slate-800">{roleData.label}</td>
                                {allPermissionKeys.map(permissionKey => (
                                    <td key={permissionKey} className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={!!roleData.permissions[permissionKey]}
                                            onChange={(e) => onPermissionChange(roleName, permissionKey, e.target.checked)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <p className="text-xs mt-4 text-gray-500 dark:text-slate-400">
                POC Note: Permission changes are for this session only and will reset on page refresh.
            </p>
        </div>
    );
}