// =================================================================================
// FILE: src/features/case/components/ActivityLogView.tsx
// =================================================================================
'use client';

import React from 'react';
import {
  Activity, CheckCircle, FilePlus, Link2, PlusCircle, RefreshCw, UserCheck, UserPlus, XCircle
} from 'lucide-react';
import type { ActivityLog } from '@/types/entities';

interface User {
  userId: string;
  name: string;
}

interface ActivityLogViewProps {
  activities: ActivityLog[];
  users: User[];
}

// Helper to get an icon based on the activity type
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, React.ElementType> = {
    'case_created': PlusCircle,
    'document_uploaded': FilePlus,
    'document_linked': Link2,
    'document_reverted': RefreshCw,
    'case_assigned': UserPlus,
    'case_updated': UserCheck,
    'case_approved': CheckCircle,
    'case_rejected': XCircle,
  };
  const Icon = iconMap[type] || Activity;
  return <Icon size={16} className="text-slate-500" />;
};

export function ActivityLogView({ activities, users }: ActivityLogViewProps) {
  const sortedActivities = [...activities].reverse();

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedActivities.map((activity, index) => {
          const user = users.find(u => u.userId === activity.performedBy);
          return (
            <li key={activity.activityId}>
              <div className="relative pb-8">
                {/* Render a connecting line for all but the last item */}
                {index !== sortedActivities.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div className="relative px-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 ring-8 ring-white dark:ring-slate-800">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1.5">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{user?.name || 'System'}</span>
                      <span className="ml-1">{activity.details}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}