// =================================================================================
// FILE: src/app/cases/[caseId]/page.tsx
// =================================================================================
'use client';

import React, { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { getCaseDetails } from '@/lib/apiClient';
import CaseDetailView from '@/features/case/components/CaseDetailView';
import { useAuth } from '@/context/AuthContext';
import type { Case, Party, Document, CaseDocumentLink, ScannerProfile } from '@/types/entities';

interface CaseDetailsData {
    caseData: Case;
    parties: Party[];
    documents: Document[];
    documentLinks: CaseDocumentLink[];
    scannerProfiles: ScannerProfile[];
    allUsers: { userId: string; name: string }[];
    allParties: Party[];
}

interface CaseDetailPageProps {
  params: Promise<{ caseId: string }>;
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  const resolvedParams = use(params);
  const { caseId } = resolvedParams;

  const [details, setDetails] = useState<CaseDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
        setIsLoading(true);
        return;
    }

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const caseDetails = await getCaseDetails(caseId);

        if (!caseDetails) {
          return notFound();
        }

        setDetails(caseDetails as CaseDetailsData);

      } catch (err) {
        console.error("Failed to fetch case details:", err);
        setError(err instanceof Error ? err.message : "Failed to load case details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [caseId, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {!isAuthenticated ? 'Authenticating...' : 'Loading case details...'}
                </p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        </div>
    );
  }

  if (!details) {
    return notFound();
  }

  return <CaseDetailView details={details} />;
}