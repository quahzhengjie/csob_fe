// =================================================================================
// FILE: src/app/admin/printer-profiles/page.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { getScannerProfiles } from '@/lib/apiClient';
import PrinterProfileAdmin from '@/features/admin/components/PrinterProfileAdmin';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { ScannerProfile } from '@/types/entities';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrinterProfilesPage() {
    const [profiles, setProfiles] = useState<ScannerProfile[]>([]);
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
                const profilesData = await getScannerProfiles();
                setProfiles(profilesData);
            } catch (err) {
                console.error("Failed to fetch printer profiles:", err);
                setError(err instanceof Error ? err.message : "Failed to load printer profiles.");
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
                    <Loader2 className="animate-spin h-12 w-12 text-gray-900 dark:text-gray-100 mx-auto" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                        {!isAuthenticated ? 'Authenticating...' : 'Loading printer profiles...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600 dark:text-red-400">Error: {error}</div>
            </div>
        );
    }

    return (
        <WithPermission permission="admin:manage-templates">
            <PrinterProfileAdmin initialProfiles={profiles} />
        </WithPermission>
    );
}