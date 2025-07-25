// =================================================================================
// FILE: src/features/case/components/CallReportsView.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { CallReport } from '@/types/entities';
import { CallReportModal } from './CallReportModal';

interface CallReportsViewProps {
  reports: CallReport[];
  onAddReport: (reportData: Omit<CallReport, 'reportId'>) => void;
}

export function CallReportsView({ reports, onAddReport }: CallReportsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CallReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onAddReport}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Call Reports</h3>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus size={16}/> Add Report
          </button>
        </div>
        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.reportId} className="p-4 rounded-lg border bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(report.callDate).toLocaleDateString()}</p>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">{report.summary}</p>
                {report.nextSteps && <p className="text-xs text-slate-500 mt-2"><b>Next Steps:</b> {report.nextSteps}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-center py-8 text-slate-500">No call reports have been logged for this case.</p>
          )}
        </div>
      </div>
    </>
  );
}