// =================================================================================
// FILE: src/app/templates/page.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { getDocumentRequirements } from '@/lib/apiClient';
import { TemplateManagerView } from '@/features/admin/components/TemplateManagerView';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { DocumentRequirements } from '@/types/entities';
import { useAuth } from '@/context/AuthContext';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<DocumentRequirements | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // Only fetch data if the user is authenticated
        if (!isAuthenticated) {
            setIsLoading(true);
            return;
        }

        const fetchTemplates = async () => {
            try {
                setIsLoading(true);
                const templatesData = await getDocumentRequirements();
                setTemplates(templatesData);
            } catch (err) {
                console.error("Failed to fetch templates:", err);
                setError(err instanceof Error ? err.message : "Failed to load templates.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, [isAuthenticated]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                        {!isAuthenticated ? 'Authenticating...' : 'Loading templates...'}
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

    if (!templates) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600 dark:text-gray-300">No templates found.</div>
            </div>
        );
    }

    return (
        <WithPermission permission="admin:manage-templates">
            <div className="container mx-auto px-4 py-8">
                <TemplateManagerView initialTemplates={templates} />
            </div>
        </WithPermission>
    );
}