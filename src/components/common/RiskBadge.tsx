// =================================================================================
// FILE: src/components/common/RiskBadge.tsx
// =================================================================================
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

// Define the possible values for a risk level
type RiskLevel = 'High' | 'Medium' | 'Low';

// Define the props for the component, using the specific RiskLevel type
interface RiskBadgeProps {
  level: RiskLevel;
}

// Define the shape of the configuration object for each badge style
interface BadgeStyle {
  label: string;
  color: string;
  darkColor: string;
  icon: keyof typeof LucideIcons;
}

// Helper component to dynamically render Lucide icons
const DynamicIcon = ({ name, ...props }: { name: keyof typeof LucideIcons } & LucideProps) => {
  // CORRECTED: The looked-up component is now explicitly cast to a ComponentType,
  // which resolves the TypeScript error.
  const Icon = LucideIcons[name] as React.ComponentType<LucideProps>;

  // We can also add a fallback, though with our strict 'keyof' type, it's less likely to be needed.
  return Icon ? <Icon {...props} /> : null;
};

export const RiskBadge = ({ level }: RiskBadgeProps) => {
  const { darkMode } = useTheme();

  // Configuration is defined locally inside the component.
  const cfgMap: Record<RiskLevel, BadgeStyle> = {
    High: {
      label: 'High Risk',
      color: 'bg-red-100 text-red-800',
      darkColor: 'bg-red-800/30 text-red-300',
      icon: 'ShieldAlert',
    },
    Medium: {
      label: 'Medium Risk',
      color: 'bg-yellow-100 text-yellow-800',
      darkColor: 'bg-yellow-800/30 text-yellow-300',
      icon: 'ShieldHalf',
    },
    Low: {
      label: 'Low Risk',
      color: 'bg-green-100 text-green-800',
      darkColor: 'bg-green-800/30 text-green-300',
      icon: 'ShieldCheck',
    },
  };

  const cfg = cfgMap[level];

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