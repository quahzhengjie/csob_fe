// =================================================================================
// FILE: src/app/cases/page.tsx
// =================================================================================
'use client';

import React from 'react';
import { CasesListView } from '@/features/cases/components/CasesListView';
import { useAuth } from '@/context/AuthContext';
import CasesLoading from '@/components/cases/loading';

export default function CasesPage() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, show loading
  if (!isAuthenticated) {
    return <CasesLoading />;
  }

  // CasesListView handles its own data fetching, loading states, and error handling
  return <CasesListView />;
}