// =================================================================================
// FILE: src/features/tasks/components/MyTasksView.tsx
// =================================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import type { Case } from '@/types/entities';
import { RiskBadge } from '@/components/common/RiskBadge';
import { CheckSquare, ChevronRight } from 'lucide-react';

interface MyTasksViewProps {
  tasks: Case[];
}

export function MyTasksView({ tasks }: MyTasksViewProps) {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You have {tasks.length} pending task(s).
            </p>
        </div>

        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">All caught up!</h3>
                    <p>You have no outstanding tasks.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <Link 
                            key={task.caseId}
                            href={`/cases/${task.caseId}`}
                            className="p-4 rounded-lg border flex justify-between items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150 border-gray-200 dark:border-slate-700"
                        >
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {task.entity.entityName}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {task.caseId} &bull; <span className="font-medium">{task.status}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <RiskBadge level={task.riskLevel} />
                                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}