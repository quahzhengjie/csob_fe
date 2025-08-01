// =================================================================================
// FILE: src/features/case/components/CreditDetailsView.tsx
// =================================================================================
'use client';

import React from 'react';
// CORRECTED: Removed unused 'Document' type from import
import type { Case, ScannerProfile } from '@/types/entities';
import type { ChecklistDocument } from '../utils/checklist';
import { DocumentRequirement } from './DocumentRequirement';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface CreditDetailsViewProps {
    caseData: Case;
    scannerProfiles: ScannerProfile[];
    onLinkDocument: (doc: ChecklistDocument) => void;
    onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
    onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
    onShowHistory: (doc: ChecklistDocument) => void;
    onPreview: (doc: ChecklistDocument) => void;
}

const InfoItem = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-md font-semibold text-slate-900 dark:text-slate-100">{value || '-'}</p>
    </div>
);

export function CreditDetailsView({ caseData, scannerProfiles, onLinkDocument, onUploadDocument, onScan, onShowHistory, onPreview }: CreditDetailsViewProps) {
  const creditDetails = caseData.entity.creditDetails;

  const creditDocsChecklist: ChecklistDocument[] = [
      { name: 'Master Credit Agreement', status: 'Missing', ownerId: caseData.entity.customerId, ownerName: caseData.entity.entityName, required: true },
      { name: 'Financial Statements', status: 'Missing', ownerId: caseData.entity.customerId, ownerName: caseData.entity.entityName, required: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Credit Information</h3>
          {creditDetails ? (
            <div className="space-y-4">
              <InfoItem label="Credit Limit" value={`$${creditDetails.creditLimit.toLocaleString()}`} />
              <InfoItem label="Credit Score / Rating" value={creditDetails.creditScore} />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assessment Notes</p>
                <p className="mt-1 text-md text-slate-900 dark:text-slate-100">{creditDetails.assessmentNotes}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No credit details available for this case.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Credit Documents</h3>
            <div className="space-y-2">
              {creditDocsChecklist.map((doc, index) => (
                <DocumentRequirement
                    key={index}
                    document={doc}
                    scannerProfiles={scannerProfiles}
                    isSelected={false}
                    onSelect={() => {}}
                    onLink={onLinkDocument}
                    onUpload={onUploadDocument}
                    onScan={onScan}
                    onShowHistory={onShowHistory}
                    onPreview={onPreview}
                />
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}