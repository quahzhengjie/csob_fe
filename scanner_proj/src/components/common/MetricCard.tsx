// =================================================================================
// FILE: src/components/common/MetricCard.tsx
// =================================================================================
'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend }: MetricCardProps) => {
  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-slate-700">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <p className="text-sm mt-1 text-gray-600 dark:text-slate-400">
        {title}
      </p>
    </div>
  );
};