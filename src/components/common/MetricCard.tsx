// Update your src/components/common/MetricCard.tsx file

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string | React.ReactNode; // Updated to accept ReactNode for tooltips
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down';
  trendValue?: string;
  subtitle?: string;
  variant?: 'default' | 'warning';
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection,
  trendValue,
  subtitle,
  variant = 'default'
}: MetricCardProps) {
  const isWarning = variant === 'warning';
  
  return (
    <div className={`p-6 rounded-xl border transition-all ${
      isWarning 
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' 
        : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`text-sm font-medium ${
              isWarning 
                ? 'text-amber-900 dark:text-amber-200' 
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {title}
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${
            isWarning 
              ? 'text-amber-900 dark:text-amber-100' 
              : 'text-slate-900 dark:text-white'
          }`}>
            {value}
          </div>
          {subtitle && (
            <p className={`text-xs mt-1 ${
              isWarning 
                ? 'text-amber-700 dark:text-amber-300' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trendDirection && (
                <span className={`text-xs font-medium ${
                  trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trendDirection === 'up' ? '↑' : '↓'} {trendValue}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${
          isWarning 
            ? 'bg-amber-100 dark:bg-amber-800/30' 
            : 'bg-slate-100 dark:bg-slate-700/50'
        }`}>
          <Icon className={`h-5 w-5 ${
            isWarning 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-slate-600 dark:text-slate-400'
          }`} />
        </div>
      </div>
    </div>
  );
}