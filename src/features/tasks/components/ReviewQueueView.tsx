// =================================================================================
// FILE: src/features/tasks/components/ReviewQueueView.tsx
// =================================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import type { Case, User } from '@/types/entities';
import { RiskBadge } from '@/components/common/RiskBadge';
import { ClipboardList } from 'lucide-react';

interface ReviewQueueViewProps {
  cases: Case[];
  users: User[];
}

export function ReviewQueueView({ cases, users }: ReviewQueueViewProps) {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Review Queue</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                There are {cases.length} cases pending your approval.
            </p>
        </div>

        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            {cases.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">Queue is empty</h3>
                    <p>There are no cases pending approval at this time.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map(item => {
                        const assignedUser = users.find(u => u.userId === item.assignedTo);
                        return (
                            <div key={item.caseId} className="p-4 rounded-lg border flex justify-between items-center border-gray-200 dark:border-slate-700">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-100">
                                        {item.entity.entityName}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Submitted by: {assignedUser?.name || 'Unknown'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <RiskBadge level={item.riskLevel} />
                                    <Link href={`/cases/${item.caseId}`} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                        Review
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}