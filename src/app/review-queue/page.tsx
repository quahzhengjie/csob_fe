// =================================================================================
// FILE: src/app/review-queue/page.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { getCases, getBasicUsers } from '@/lib/apiClient';  // Changed to getBasicUsers
import { ReviewQueueView } from '@/features/tasks/components/ReviewQueueView';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { Case, User } from '@/types/entities';
import { useAuth } from '@/context/AuthContext';

export default function ReviewQueuePage() {
    const [pendingCases, setPendingCases] = useState<Case[]>([]);
    const [users, setUsers] = useState<User[]>([]);
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
                // Fetch both cases and basic users in parallel
                const [allCases, basicUsers] = await Promise.all([
                    getCases(),
                    getBasicUsers()  // Changed from getUsers()
                ]);

                // Filter for cases that are pending approval
                const casesForReview = allCases.filter(
                    c => c.status === 'Pending Approval'
                );
                
                setPendingCases(casesForReview);
                
                // Map basic users to User type (with minimal fields)
                const mappedUsers: User[] = basicUsers.map(bu => ({
                    userId: bu.userId,
                    name: bu.name,
                    username: '', // FIX: Add missing username property
                    email: '',  // Not provided by basic endpoint
                    role: '',   // Not provided by basic endpoint
                    roleId: 0,  // Not provided by basic endpoint
                    department: bu.department || '',
                    isActive: true  // Basic endpoint only returns active users
                }));
                
                setUsers(mappedUsers);
            } catch (err) {
                console.error("Failed to fetch review queue data:", err);
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
                        {!isAuthenticated ? 'Authenticating...' : 'Loading review queue...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    return (
        <WithPermission permission="case:approve">
            <ReviewQueueView cases={pendingCases} users={users} />
        </WithPermission>
    );
}