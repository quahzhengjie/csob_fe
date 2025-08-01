// =================================================================================
// FILE: src/app/page.tsx
// =================================================================================
import React from 'react';
// CORRECTED: Import the new, integrated 'getCases' function
import { getCases } from '@/lib/apiClient';
import { DashboardView } from '@/features/dashboard/components/DashboardView';

/**
 * The main Dashboard page.
 * This is a Server Component that fetches all case data and passes it to the client view.
 */
export default async function DashboardPage() {
  // CORRECTED: Call the new 'getCases' function to fetch live data
  const cases = await getCases();

  // Render the client component with the fetched data
  return <DashboardView cases={cases} />;
}