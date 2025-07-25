// =================================================================================
// FILE: src/features/rbac/usePermission.ts
// =================================================================================
'use client';

import { useEnumStore } from '@/features/enums/useEnumStore';

// CORRECTED: This function now reads the role from localStorage to sync with the UI.
const getSession = () => {
  // This check ensures the code doesn't break during server-side rendering where localStorage is not available.
  if (typeof window === 'undefined') {
    return { user: { name: 'Admin User', role: 'General Manager' } };
  }

  const role = localStorage.getItem('currentUserRole') || 'General Manager';
  return {
    user: { name: 'Current User', role: role },
  };
};

export const useHasPermission = () => {
  const roles = useEnumStore((s) => s.roles);
  const session = getSession();

  // Return a function that can be called with the required permission
  const hasPermission = (permission: string): boolean => {
      if (!session?.user?.role || !roles[session.user.role]) {
          return false;
      }
      return !!roles[session.user.role].permissions?.[permission];
  };

  return hasPermission;
};