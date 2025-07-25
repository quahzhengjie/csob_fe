// =================================================================================
// FILE: src/app/page.tsx
// =================================================================================
import React from 'react';
import { getMockCases } from '@/lib/apiClient';
import { DashboardView } from '@/features/dashboard/components/DashboardView';

/**
 * The main Dashboard page.
 * This is a Server Component that fetches all case data and passes it to the client view.
 */
export default async function DashboardPage() {
  // Fetch data on the server
  const cases = await getMockCases();

  // Render the client component with the fetched data
  return <DashboardView cases={cases} />;
}