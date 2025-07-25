// =================================================================================
// FILE: src/app/my-tasks/page.tsx
// =================================================================================
import React from 'react';
import { getMockCases } from '@/lib/apiClient';
import { MyTasksView } from '@/features/tasks/components/MyTasksView';
import type { Case } from '@/types/entities';

export default async function MyTasksPage() {
    const allCases = await getMockCases();

    // In a real app, you'd get the current user ID from the session.
    const currentUserId = 'USER-001';

    // Filter cases to find tasks for the current user
    const myTasks: Case[] = allCases.filter(c => 
        c.assignedTo === currentUserId && 
        c.status !== 'Active' && 
        c.status !== 'Rejected'
    );

    return <MyTasksView tasks={myTasks} />;
}