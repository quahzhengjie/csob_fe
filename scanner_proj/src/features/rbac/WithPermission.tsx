// =================================================================================
// FILE: src/features/rbac/WithPermission.tsx
// =================================================================================
'use client';

import React from 'react';
import { useHasPermission } from './usePermission';

interface WithPermissionProps {
  permission: string;
  children: React.ReactNode;
}

export function WithPermission({ permission, children }: WithPermissionProps) {
  // CORRECTED:
  // 1. Call the hook with no arguments to get the checker function.
  const hasPermission = useHasPermission();

  // 2. Call the returned function with the desired permission to get the boolean result.
  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}