// =================================================================================
// FILE: src/app/parties/[partyId]/page.tsx
// =================================================================================
import React from 'react';
import { notFound } from 'next/navigation';
import { getPartyDetails, getCases } from '@/lib/apiClient';
import PartyProfileView from '@/features/party/components/PartyProfileView';

interface PartyProfilePageProps {
  params: Promise<{ partyId: string }>;
}

export default async function PartyProfilePage({ params }: PartyProfilePageProps) {
  const { partyId } = await params;
  
  // Fetch party details and all cases in parallel
  const [partyDetails, allCases] = await Promise.all([
    getPartyDetails(partyId),
    getCases()
  ]);

  if (!partyDetails) notFound();

  /* ---------- build "associated entities" for this person ---------- */
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

  return (
    <PartyProfileView
      details={{ ...partyDetails, associations }}   // ← now includes the array
    />
  );
}