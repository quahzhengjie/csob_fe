// =================================================================================
// FILE: src/features/rbac/usePermission.ts
// =================================================================================
'use client';

import { useAuth } from '@/context/AuthContext';
import type { AuthResponse } from '@/types/entities';

/**
 * A hook that returns a function to check if the currently authenticated user
 * has a specific permission. It gets its data directly from the AuthContext.
 *
 * @example
 * const canEdit = useHasPermission();
 * if (canEdit('case:update')) {
 * // render edit button
 * }
 */
export const useHasPermission = () => {
  // FIX: This hook now gets the real hasPermission function from our central AuthContext,
  // removing the old, hardcoded session logic.
  const { hasPermission } = useAuth();
  return hasPermission;
};

/**
 * A hook to get the full details of the currently logged-in user.
 * It returns the user object stored in the AuthContext.
 */
export const useCurrentUser = (): AuthResponse | null => {
    const { user } = useAuth();
    return user;
};
