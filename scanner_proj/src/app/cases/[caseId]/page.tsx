// =================================================================================
// FILE: src/app/cases/[caseId]/page.tsx
// =================================================================================
import React from 'react';
import { notFound } from 'next/navigation';
import { getCaseDetails, getParties } from '@/lib/apiClient';
import CaseDetailView from '@/features/case/components/CaseDetailView';

// CORRECTED: The 'params' prop type must be a Promise.
interface CaseDetailPageProps {
  params: Promise<{ caseId: string }>;
}

/**
 * Server Component for the Individual Party Profile page.
 * Fetches all data related to a single party and passes it to the client view.
 */
export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  // CORRECTED: We must 'await' the params promise to get the value.
  const { caseId } = await params;
  const details = await getCaseDetails(caseId);
  const allParties = await getParties();

  if (!details) {
    notFound();
  }

  return <CaseDetailView details={{ ...details, allParties }} />;
}