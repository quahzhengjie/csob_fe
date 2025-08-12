// =================================================================================
// FILE: src/features/case/components/UpdateCaseModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useEnumStore } from '@/features/enums/useEnumStore';
import type { CaseStatus, RiskLevel } from '@/types/entities';

interface UpdateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: { status: CaseStatus, riskLevel: RiskLevel }) => void;
  currentStatus: CaseStatus;
  currentRiskLevel: RiskLevel;
}

export function UpdateCaseModal({ isOpen, onClose, onUpdate, currentStatus, currentRiskLevel }: UpdateCaseModalProps) {
  const [status, setStatus] = useState<CaseStatus>(currentStatus);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(currentRiskLevel);

  const { caseStatus: caseStatusOptions, riskLevel: riskLevelOptions } = useEnumStore(s => s.enums);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ status, riskLevel });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Update Case Details</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Case Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              {caseStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="riskLevel" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Risk Level</label>
            <select
              id="riskLevel"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
               {riskLevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}