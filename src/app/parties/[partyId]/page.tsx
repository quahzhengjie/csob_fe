// =================================================================================
// FILE: src/app/parties/[partyId]/page.tsx
// =================================================================================
'use client';

import React, { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { getPartyDetails, getCases } from '@/lib/apiClient';
import PartyProfileView from '@/features/party/components/PartyProfileView';
import { useAuth } from '@/context/AuthContext';
import type { Party, Document, ScannerProfile } from '@/types/entities';

interface PartyProfilePageProps {
  params: Promise<{ partyId: string }>;
}

interface PartyDetailsData {
  party: Party;
  documents: Document[];
  scannerProfiles: ScannerProfile[];
  associations: Array<{
    caseId: string;
    entityName: string;
    entityType: string;
    roles: string[];
  }>;
}

export default function PartyProfilePage({ params }: PartyProfilePageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const partyId = resolvedParams.partyId;

  const [details, setDetails] = useState<PartyDetailsData | null>(null);
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
        
        // Fetch party details and all cases in parallel
        const [partyDetails, allCases] = await Promise.all([
          getPartyDetails(partyId),
          getCases()
        ]);

        if (!partyDetails) {
          return notFound();
        }

        // Build "associated entities" for this person
        const associations = allCases.flatMap(c =>
          (c.relatedPartyLinks ?? [])
            .filter(link => link.partyId === partyId)
            .map(link => ({
              caseId: c.caseId,
              entityName: c.entity.entityName,
              entityType: c.entity.entityType,
              roles: link.relationships.map(r => r.type),
            }))
        );

        setDetails({
          ...partyDetails,
          associations
        });
      } catch (err) {
        console.error("Failed to fetch party details:", err);
        setError(err instanceof Error ? err.message : "Failed to load party details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [partyId, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {!isAuthenticated ? 'Authenticating...' : 'Loading party details...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return notFound();
  }

  return <PartyProfileView details={details} />;
}