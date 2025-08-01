// =================================================================================
// FILE: src/components/common/MetricCard.tsx
// =================================================================================
'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down';
  trendValue?: string;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  onClick?: () => void;
  isClickable?: boolean;
}

export const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendDirection,
  trendValue,
  subtitle,
  variant = 'default',
  onClick,
  isClickable = false
}: MetricCardProps) => {
  const variantStyles = {
    default: {
      bg: 'bg-gray-100 dark:bg-slate-700',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-gray-200 dark:border-slate-700'
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800'
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    }
  };

  const styles = variantStyles[variant];
  
  return (
    <div 
      className={`
        p-6 rounded-xl border bg-white dark:bg-slate-800 shadow-sm transition-all duration-200
        ${styles.border}
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${styles.bg}`}>
          <Icon className={`h-6 w-6 ${styles.icon}`} />
        </div>
        {(trend || trendDirection) && (
          <div className="flex items-center gap-1">
            {trendDirection && (
              trendDirection === 'up' 
                ? <ArrowUpRight className="h-4 w-4 text-green-500" />
                : <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              trend?.startsWith('+') || trendDirection === 'up' 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {trendValue || trend}
            </span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <p className="text-sm mt-1 text-gray-600 dark:text-slate-400">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs mt-1 text-gray-500 dark:text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};