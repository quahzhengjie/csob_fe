// =================================================================================
// FILE: src/app/templates/page.tsx
// =================================================================================
import React from 'react';
import { getDocumentRequirements } from '@/lib/apiClient';
import { TemplateManagerView } from '@/features/admin/components/TemplateManagerView';
import { WithPermission } from '@/features/rbac/WithPermission';

export default async function TemplatesPage() {
    const templates = await getDocumentRequirements();

    return (
        <WithPermission permission="admin:manage-templates">
            <div className="container mx-auto px-4 py-8">
                <TemplateManagerView initialTemplates={templates} />
            </div>
        </WithPermission>
    );
}