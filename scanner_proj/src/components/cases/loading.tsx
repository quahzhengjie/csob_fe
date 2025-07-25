// =================================================================================
// FILE: src/app/cases/loading.tsx
// =================================================================================
import React from 'react';

/**
 * A loading skeleton UI for the main cases list page.
 * This component is automatically rendered by Next.js while the data for the page is loading.
 */
export default function CasesLoading() {
  return (
    <div className="space-y-6">
      {/* Skeleton for Header and "New Case" button */}
      <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 bg-gray-200 rounded-md dark:bg-slate-700 w-1/3 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-md dark:bg-slate-700 w-28 animate-pulse"></div>
        </div>
        {/* Skeleton for Filter bars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-200 rounded-lg dark:bg-slate-700 animate-pulse col-span-4"></div>
          <div className="h-10 bg-gray-200 rounded-lg dark:bg-slate-700 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg dark:bg-slate-700 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg dark:bg-slate-700 animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton for the Cases Table */}
      <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="p-4"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded animate-pulse w-3/4"></div></th>
              <th className="p-4"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded animate-pulse w-1/2"></div></th>
              <th className="p-4"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded animate-pulse w-1/2"></div></th>
              <th className="p-4"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded animate-pulse w-3/4"></div></th>
              <th className="p-4"><div className="h-4 bg-gray-300 dark:bg-slate-600 rounded animate-pulse w-full"></div></th>
            </tr>
          </thead>
          <tbody>
            {/* Create an array of 5 empty items to map over for skeleton rows */}
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-slate-700">
                <td className="p-4"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                <td className="p-4"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                <td className="p-4"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                <td className="p-4"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
                <td className="p-4"><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}