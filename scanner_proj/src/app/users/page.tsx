// =================================================================================
// FILE: src/app/users/page.tsx
// =================================================================================
import React from 'react';
import { getMockUsers, getMockEnums } from '@/lib/apiClient';
import { UserManagementView } from '@/features/admin/components/UserManagementView';
import { WithPermission } from '@/features/rbac/WithPermission';

export default async function UsersPage() {
    const users = await getMockUsers();
    const { roles } = await getMockEnums();

    return (
        <WithPermission permission="admin:manage-users">
            <UserManagementView initialUsers={users} userRoles={roles} />
        </WithPermission>
    );
}