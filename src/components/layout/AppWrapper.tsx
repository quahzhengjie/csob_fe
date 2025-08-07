// =================================================================================
// CREATE src/components/layout/AppWrapper.tsx
// =================================================================================
'use client';

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const pathname = usePathname();
  
  // Define public routes that don't need authentication
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If it's a public route, just render children
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // Otherwise, wrap with ProtectedRoute
  return <ProtectedRoute>{children}</ProtectedRoute>;
}