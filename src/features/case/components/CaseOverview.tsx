// =================================================================================
// FILE: src/features/case/components/CaseOverview.tsx
// =================================================================================
'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ChecklistDocument } from '../utils/checklist';

interface CaseOverviewProps {
  progress: {
    percentage: number;
    missingDocs: ChecklistDocument[];
  };
}

export function CaseOverview({ progress }: CaseOverviewProps) {
  const { percentage, missingDocs } = progress;

  // RESTORED: Handler function to find and scroll to the document
  const handleScrollToDocument = (doc: ChecklistDocument) => {
    const elementId = `doc-${doc.ownerId}-${doc.name.replace(/[\s/]/g, '-')}`;
    const element = document.getElementById(elementId);
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-yellow-100', 'dark:bg-yellow-800/30', 'ring-2', 'ring-yellow-500', 'transition-all', 'duration-300');
        setTimeout(() => {
            element.classList.remove('bg-yellow-100', 'dark:bg-yellow-800/30', 'ring-2', 'ring-yellow-500');
        }, 2500);
    }
  };

  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-gray-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" /><path className={percentage >= 95 ? "text-green-500" : "text-blue-500"} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" /></svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{percentage}%</span></div>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Documents Collected</p>
        </div>
        <div className="md:col-span-2">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Missing Documents ({missingDocs.length})</h4>
          {missingDocs.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {/* RESTORED: Each item is now a button that triggers the scroll */}
              {missingDocs.map((doc, index) => (
                <button key={index} onClick={() => handleScrollToDocument(doc)} className="w-full text-left flex items-center gap-3 p-2 rounded-md bg-red-50 dark:bg-red-900/20 ring-1 ring-inset ring-red-500/10 hover:bg-red-100 dark:hover:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{doc.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Owner: {doc.ownerName}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 rounded-md bg-green-50 dark:bg-green-900/20 ring-1 ring-inset ring-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" /><p className="text-sm font-semibold text-green-700 dark:text-green-300">All required documents are collected!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}