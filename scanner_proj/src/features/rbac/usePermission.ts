// =================================================================================
// FILE: src/features/rbac/usePermission.ts
// =================================================================================
'use client';

import React from 'react';
import { useEnumStore } from '@/features/enums/useEnumStore';

// FOR TESTING ONLY - In production, this would get the session from your auth provider
const getSession = () => {
  // During SSR, we can't access localStorage, so always use default
  if (typeof window === 'undefined') {
    return { user: { name: 'Admin User', role: 'ROLE_MANAGER' } };
  }

  // On client, check localStorage
  const role = localStorage.getItem('currentUserRole') || 'ROLE_MANAGER';
  return {
    user: { name: 'Current User', role: role },
  };
};

export const useHasPermission = () => {
  const roles = useEnumStore((s) => s.roles);
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return a function that can be called with the required permission
  const hasPermission = (permission: string): boolean => {
      // During SSR or before mount, assume all permissions (to match server render)
      if (!mounted) {
          return true;
      }
      
      const session = getSession();
      if (!session?.user?.role || !roles[session.user.role]) {
          return false;
      }
      return !!roles[session.user.role].permissions?.[permission];
  };

  return hasPermission;
};

// -
// // =================================================================================
// // FILE: src/features/rbac/usePermission.ts (PRODUCTION VERSION)
// // =================================================================================
// 'use client';

// import { useSession } from 'next-auth/react'; // or your auth library
// import { useEnumStore } from '@/features/enums/useEnumStore';

// export const useHasPermission = () => {
//   const roles = useEnumStore((s) => s.roles);
//   const { data: session, status } = useSession();

//   // Return a function that can be called with the required permission
//   const hasPermission = (permission: string): boolean => {
//       // While loading, don't show restricted content
//       if (status === 'loading') {
//           return false;
//       }
      
//       // If not authenticated, no permissions
//       if (!session?.user?.role || !roles[session.user.role]) {
//           return false;
//       }
      
//       return !!roles[session.user.role].permissions?.[permission];
//   };

//   return hasPermission;
// };