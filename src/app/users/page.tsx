// =================================================================================
// FILE: src/app/users/page.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { getUsers, getEnums } from '@/lib/apiClient';
import { UserManagementView } from '@/features/admin/components/UserManagementView';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { User, Role } from '@/types/entities';
import { useAuth } from '@/context/AuthContext';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [userRoles, setUserRoles] = useState<Record<string, Role>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // Only fetch data if the user is authenticated
        if (!isAuthenticated) {
            setIsLoading(true);
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                // Fetch users and enums in parallel
                const [usersData, enumsData] = await Promise.all([
                    getUsers(),
                    getEnums()
                ]);
                
                setUsers(usersData);
                setUserRoles(enumsData.roles);
            } catch (err) {
                console.error("Failed to fetch users data:", err);
                setError(err instanceof Error ? err.message : "Failed to load data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                        {!isAuthenticated ? 'Authenticating...' : 'Loading users...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <WithPermission permission="admin:manage-users">
            <UserManagementView initialUsers={users} userRoles={userRoles} />
        </WithPermission>
    );
}