// =================================================================================
// FILE: src/app/my-tasks/page.tsx
// =================================================================================
'use client'; // <-- Add this directive to make it a Client Component

import React, { useState, useEffect } from 'react';
import { getCases } from '@/lib/apiClient';
import { MyTasksView } from '@/features/tasks/components/MyTasksView';
import type { Case } from '@/types/entities';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to get the current user

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth(); // Get the authenticated user from the context

    useEffect(() => {
        // Only fetch data if the user is authenticated
        if (!isAuthenticated || !user) {
            // If not authenticated yet, keep showing loading state
            setIsLoading(true);
            return;
        }

        const fetchTasks = async () => {
            try {
                // Ensure loading is true at the start of the fetch
                setIsLoading(true);
                const allCases = await getCases();

                // Filter cases to find tasks assigned to the *current* user
                const myTasks: Case[] = allCases.filter(c =>
                    c.assignedTo === user.userId &&
                    c.status !== 'Active' &&
                    c.status !== 'Rejected'
                );
                setTasks(myTasks);
            } catch (err) {
                console.error("Failed to fetch tasks:", err);
                setError(err instanceof Error ? err.message : "Failed to load tasks.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [isAuthenticated, user]); // Re-run the effect if the user or auth state changes

    if (isLoading || !isAuthenticated) {
        // A more sophisticated loading skeleton for better UX
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 bg-gray-200 rounded-md dark:bg-slate-700 w-1/3 animate-pulse"></div>
                    <div className="h-4 mt-2 bg-gray-200 rounded-md dark:bg-slate-700 w-1/2 animate-pulse"></div>
                </div>
                <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                    <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border flex justify-between items-center border-gray-200 dark:border-slate-700">
                                <div>
                                    <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded-full w-24"></div>
                                    <div className="h-5 w-5 bg-gray-300 dark:bg-slate-600 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    return <MyTasksView tasks={tasks} />;
}