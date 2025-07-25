
// =================================================================================
// FILE: src/app/cases/page.tsx
// =================================================================================
import React from 'react';
import { getMockCases } from '@/lib/apiClient';
import { CasesListView } from '@/features/cases/components/CasesListView';

export default async function CasesPage() {
  const cases = await getMockCases();
  return <CasesListView cases={cases} />;
}