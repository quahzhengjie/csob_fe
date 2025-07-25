// =================================================================================
// FILE: src/features/dashboard/components/DashboardView.tsx
// =================================================================================
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { Case } from '@/types/entities';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Building2, TrendingUp, AlertTriangle, CheckCircle, UserCheck } from 'lucide-react';

interface DashboardViewProps {
  cases: Case[];
}

// A simple helper function to format dates relatively
function formatDateAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
}

export function DashboardView({ cases }: DashboardViewProps) {
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const inProgress = cases.filter(c => c.status === 'KYC Review').length;
    const pendingApproval = cases.filter(c => c.status === 'Pending Approval').length;
    const active = cases.filter(c => c.status === 'Active').length;
    const overdue = cases.filter(c => new Date(c.slaDeadline) < new Date()).length;
    return { totalCases, inProgress, pendingApproval, active, overdue };
  }, [cases]);

  // ADDED: Logic to sort cases by creation date and get the top 5
  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          An overview of the KYC onboarding process.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard title="Total Cases" value={stats.totalCases} icon={Building2} trend="+2 this week" />
        <MetricCard title="Cases In Progress" value={stats.inProgress} icon={TrendingUp} />
        <MetricCard title="Pending Approval" value={stats.pendingApproval} icon={UserCheck} />
        <MetricCard title="Overdue Cases" value={stats.overdue} icon={AlertTriangle} />
        <MetricCard title="Active Accounts" value={stats.active} icon={CheckCircle} />
      </div>

      {/* UPDATED: Recent Activity Feed is now dynamic */}
      <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {recentCases.map(c => (
                <div key={c.caseId} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150 rounded-lg">
                    <div>
                        <Link href={`/cases/${c.caseId}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {c.entity.entityName}
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {c.caseId} &bull; Created {formatDateAgo(c.createdDate)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}