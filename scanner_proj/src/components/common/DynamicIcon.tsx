// =================================================================================
// FILE: src/components/common/DynamicIcon.tsx
// =================================================================================
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// CORRECTED: Using the safer type assertion provided by the user.
export const DynamicIcon = (
  { name, ...props }: { name: string } & LucideProps,
) => {
  const Icon =
    (LucideIcons[name as keyof typeof LucideIcons] ??
      null) as unknown as React.ComponentType<LucideProps> | null;

  return Icon ? <Icon {...props} /> : null;
};
