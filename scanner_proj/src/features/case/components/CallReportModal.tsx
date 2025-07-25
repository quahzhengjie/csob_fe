// =================================================================================
// FILE: src/features/case/components/CallReportModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CallReport } from '@/types/entities';

interface CallReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportData: Omit<CallReport, 'reportId'>) => void;
}

export function CallReportModal({ isOpen, onClose, onSave }: CallReportModalProps) {
    const [reportData, setReportData] = useState({
        callDate: new Date().toISOString().split('T')[0],
        summary: '',
        nextSteps: '',
    });

    if (!isOpen) return null;

    const handleChange = (field: 'callDate' | 'summary' | 'nextSteps', value: string) => {
        setReportData(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        if (!reportData.summary) {
            alert('Summary is required.');
            return;
        }
        onSave(reportData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="p-8 rounded-xl border w-full max-w-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Call Report</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Call Date</label><input type="date" value={reportData.callDate} onChange={e => handleChange('callDate', e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Discussion Summary</label><textarea rows={4} value={reportData.summary} onChange={e => handleChange('summary', e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Next Steps / Follow-up Actions</label><textarea rows={3} value={reportData.nextSteps} onChange={e => handleChange('nextSteps', e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Save Report</button>
                </div>
            </div>
        </div>
    );
}