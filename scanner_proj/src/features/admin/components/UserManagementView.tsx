// =================================================================================
// FILE: src/features/admin/components/UserManagementView.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle, XCircle, Users, Lock } from 'lucide-react';
import type { Role } from '@/types/enums';
import type { User } from '@/types/entities';
import { AddUserModal } from './AddUserModal';
import { PermissionsManager } from './PermissionsManager';
import { createUser, updateUserStatus } from '@/lib/apiClient';

interface UserManagementViewProps {
    initialUsers: User[];
    userRoles: Record<string, Role>;
}

export function UserManagementView({ initialUsers, userRoles: initialRoles }: UserManagementViewProps) {
    const [users, setUsers] = useState(initialUsers);
    const [userRoles, setUserRoles] = useState(initialRoles);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

    const handleAddUser = async (newUserData: Omit<User, 'userId' | 'isActive'>) => {
        try {
            const newUser = await createUser(newUserData);
            if (newUser) { 
                setUsers(prev => [newUser, ...prev]); 
            }
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Failed to create user:', error);
            // Consider adding error handling here (e.g., a toast notification)
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const updatedUser = await updateUserStatus(userId, !currentStatus);
            if (updatedUser) { 
                setUsers(prev => prev.map(u => u.userId === userId ? updatedUser : u)); 
            }
        } catch (error) {
            console.error('Failed to update user status:', error);
            // Consider adding error handling here (e.g., a toast notification)
        }
    };

    const handlePermissionChange = (roleName: string, permissionKey: string, value: boolean) => {
        setUserRoles(currentRoles => {
            const newRoles = JSON.parse(JSON.stringify(currentRoles));
            if(newRoles[roleName]) {
                newRoles[roleName].permissions[permissionKey] = value;
            }
            return newRoles;
        });
    };

    const TabButton = ({ tabId, label, icon: Icon }: { tabId: 'users' | 'permissions', label: string, icon: React.ElementType }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tabId
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <>
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddUser} userRoles={userRoles} />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User & Role Management</h1>
                    {activeTab === 'users' && (
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                            <UserPlus size={16}/> Add User
                        </button>
                    )}
                </div>
                
                <div className="border-b border-gray-200 dark:border-slate-700">
                    <nav className="flex -mb-px">
                        <TabButton tabId="users" label="Users" icon={Users} />
                        <TabButton tabId="permissions" label="Permissions" icon={Lock} />
                    </nav>
                </div>

                {activeTab === 'users' && (
                     <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="p-4 text-left font-semibold">Name</th>
                                    <th className="p-4 text-left font-semibold">Email</th>
                                    <th className="p-4 text-left font-semibold">Role</th>
                                    <th className="p-4 text-left font-semibold">Status</th>
                                    <th className="p-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.userId} className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                                        <td className="p-4 font-medium">{user.name}</td>
                                        <td className="p-4 text-slate-500">{user.email}</td>
                                        <td className="p-4"><span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 rounded-full">{userRoles[user.role]?.label || user.role}</span></td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'}`}>
                                                {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => handleToggleUserStatus(user.userId, user.isActive)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'permissions' && (
                    <PermissionsManager userRoles={userRoles} onPermissionChange={handlePermissionChange} />
                )}
            </div>
        </>
    );
}