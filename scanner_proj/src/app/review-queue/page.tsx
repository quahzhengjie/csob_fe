// =================================================================================
// FILE: src/app/review-queue/page.tsx
// =================================================================================
import React from 'react';
// CORRECTED: Import the new, integrated functions
import { getCases, getUsers } from '@/lib/apiClient';
import { ReviewQueueView } from '@/features/tasks/components/ReviewQueueView';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { Case } from '@/types/entities';

export default async function ReviewQueuePage() {
    // CORRECTED: Call the new functions to fetch live data
    const allCases = await getCases();
    const allUsers = await getUsers();

    // Filter for cases that are pending approval
    const pendingCases: Case[] = allCases.filter(
        c => c.status === 'Pending Approval'
    );

    return (
        <WithPermission permission="case:approve">
            <ReviewQueueView cases={pendingCases} users={allUsers} />
        </WithPermission>
    );
}
