// =================================================================================
// CREATE src/components/layout/ClientLayout.tsx - Client Component for Auth-Based Layout
// =================================================================================
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Pages that should not show header
  const noHeaderPages = ['/login', '/register', '/forgot-password'];
  const shouldShowHeader = !noHeaderPages.includes(pathname) && isAuthenticated;

  // Don't render layout until we know auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldShowHeader && <Header />}
      <main className={shouldShowHeader ? "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8" : ""}>
        {children}
      </main>
    </>
  );
}