// =================================================================================
// FILE: src/app/users/page.tsx
// =================================================================================
import React from 'react';
// CORRECTED: Import the new, integrated functions
import { getUsers, getEnums } from '@/lib/apiClient';
import { UserManagementView } from '@/features/admin/components/UserManagementView';
import { WithPermission } from '@/features/rbac/WithPermission';

export default async function UsersPage() {
    // CORRECTED: Call the new functions to fetch live data
    const users = await getUsers();
    const { roles } = await getEnums();

    return (
        <WithPermission permission="admin:manage-users">
            <UserManagementView initialUsers={users} userRoles={roles} />
        </WithPermission>
    );
}
