// =================================================================================
// FILE: src/components/common/StatusBadge.tsx
// =================================================================================
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DynamicIcon } from '@/components/common/DynamicIcon';

// Define the possible status values
type CaseStatus = 'KYC Review' | 'Pending Approval' | 'Active' | 'Rejected' | 'Prospect';

// Define the shape of the configuration object for each badge style
interface BadgeStyle {
  label: string;
  color: string;
  darkColor: string;
  icon: keyof typeof LucideIcons;
}

// Update the props to use the specific CaseStatus type
interface StatusBadgeProps {
  status: CaseStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { darkMode } = useTheme();

  // REMOVED: The useEnumStore hook is no longer needed.
  // const cfgMap  = useEnumStore((s) => s.enums.caseStatus);

  // ADDED: Configuration is now defined locally inside the component.
  const cfgMap: Record<CaseStatus, BadgeStyle> = {
    'Active': {
      label: 'Active',
      color: 'bg-green-100 text-green-800',
      darkColor: 'bg-green-800/30 text-green-300',
      icon: 'CheckCircle',
    },
    'KYC Review': {
      label: 'KYC Review',
      color: 'bg-yellow-100 text-yellow-800',
      darkColor: 'bg-yellow-800/30 text-yellow-300',
      icon: 'UserCheck',
    },
    'Pending Approval': {
      label: 'Pending Approval',
      color: 'bg-purple-100 text-purple-800',
      darkColor: 'bg-purple-800/30 text-purple-300',
      icon: 'ThumbsUp',
    },
    'Rejected': {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
      darkColor: 'bg-red-800/30 text-red-300',
      icon: 'XCircle',
    },
    'Prospect': {
        label: 'Prospect',
        color: 'bg-gray-100 text-gray-800',
        darkColor: 'bg-slate-700 text-gray-300',
        icon: 'Search',
    }
  };
  
  // The lookup is now type-safe and uses the local configuration.
  const cfg = cfgMap[status];

  // A fallback in case an unexpected status is passed (though TypeScript should prevent this)
  if (!cfg) {
      return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        darkMode ? cfg.darkColor : cfg.color
      }`}
    >
      <DynamicIcon name={cfg.icon} size={12} />
      {cfg.label}
    </span>
  );
};