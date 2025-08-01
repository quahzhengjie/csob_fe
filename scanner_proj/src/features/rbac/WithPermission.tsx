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
  const hasPermission = useHasPermission();

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}