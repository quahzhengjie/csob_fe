// =================================================================================
// FILE: src/app/cases/page.tsx
// =================================================================================
'use client'; // <-- Add this directive to make it a Client Component

import React, { useState, useEffect } from 'react';
import { getCases } from '@/lib/apiClient';
import { CasesListView } from '@/features/cases/components/CasesListView';
import CasesLoading from '@/components/cases/loading'; // Import the loading skeleton
import type { Case } from '@/types/entities';
import { useAuth } from '@/context/AuthContext';

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (!isAuthenticated) {
        setIsLoading(true);
        return;
    }

    const fetchCases = async () => {
        try {
            setIsLoading(true);
            const allCases = await getCases();
            setCases(allCases);
        } catch (err) {
            console.error("Failed to fetch cases:", err);
            setError(err instanceof Error ? err.message : "Failed to load cases.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchCases();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    // Use the dedicated loading component for a consistent look
    return <CasesLoading />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return <CasesListView cases={cases} />;
}
