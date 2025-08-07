// =================================================================================
// FILE: src/components/common/DocStatusBadge.tsx
// =================================================================================
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import type { DocStatus } from '@/types/entities';

// Define the shape of the configuration object for each badge style
interface BadgeStyle {
  label: string;
  color: string;
  darkColor: string;
  icon: keyof typeof LucideIcons;
}

// Update the props to use the specific DocStatus type
interface DocStatusBadgeProps {
  status: DocStatus;
}

export const DocStatusBadge = ({ status }: DocStatusBadgeProps) => {
  const { darkMode } = useTheme();

  const cfgMap: Record<DocStatus, BadgeStyle> = {
    'Verified': {
      label: 'Verified',
      color: 'bg-green-100 text-green-800',
      darkColor: 'bg-green-800/30 text-green-300',
      icon: 'CheckCircle2',
    },
    'Submitted': {
      label: 'Submitted',
      color: 'bg-blue-100 text-blue-800',
      darkColor: 'bg-blue-800/30 text-blue-300',
      icon: 'ArrowUpCircle',
    },
    'Missing': {
      label: 'Missing',
      color: 'bg-gray-100 text-gray-500',
      darkColor: 'bg-slate-700 text-slate-400',
      icon: 'FileQuestion',
    },
    'Rejected': {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
      darkColor: 'bg-red-800/30 text-red-300',
      icon: 'XCircle',
    },
    'Expired': {
        label: 'Expired',
        color: 'bg-orange-100 text-orange-800',
        darkColor: 'bg-orange-800/30 text-orange-300',
        icon: 'Clock',
    }
  };

  const cfg = cfgMap[status];

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