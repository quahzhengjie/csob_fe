// =================================================================================
// UPDATE src/app/page.tsx
// =================================================================================
'use client';

import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();

  console.log('🏠 Dashboard Page State:', { isAuthenticated, hasUser: !!user });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Authenticating...</p>
        </div>
      </div>
    );
  }

  // DashboardView now handles its own data fetching and loading states
  return <DashboardView />;
}