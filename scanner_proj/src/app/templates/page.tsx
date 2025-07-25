// =================================================================================
// FILE: src/app/templates/page.tsx
// =================================================================================
import React from 'react';
import { getMockTemplates } from '@/lib/apiClient';
import { TemplateManagerView } from '@/features/admin/components/TemplateManagerView';
import { WithPermission } from '@/features/rbac/WithPermission';

export default async function TemplatesPage() {
    const templates = await getMockTemplates();

    return (
        <WithPermission permission="admin:manage-users">
            <TemplateManagerView initialTemplates={templates} />
        </WithPermission>
    );
}