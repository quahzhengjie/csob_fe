// =================================================================================
// FILE: src/features/case/components/AdHocDocumentsView.tsx
// =================================================================================
'use client';

import React from 'react';
import { DocumentRequirement } from './DocumentRequirement';
import type {ScannerProfile } from '@/types/entities';
import type { ChecklistDocument } from '../utils/checklist';

interface AdHocDocumentsViewProps {
    scannerProfiles: ScannerProfile[];
    onLinkDocument: (doc: ChecklistDocument) => void;
    onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
    onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<{ documentId?: string; status?: string; message?: string }>;
    onShowHistory: (doc: ChecklistDocument) => void;
    onPreview: (doc: ChecklistDocument) => void;
}

export function AdHocDocumentsView({ scannerProfiles, onLinkDocument, onUploadDocument, onScan, onShowHistory, onPreview }: AdHocDocumentsViewProps) {
  // In a real app, we would filter for documents with a specific 'ad-hoc' category.
  // For now, we'll just show a placeholder.
  const adHocDocs: ChecklistDocument[] = [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Ad-Hoc Documents</h3>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          Upload Ad-Hoc Document
        </button>
      </div>
      <div className="space-y-2 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        {adHocDocs.length > 0 ? (
          adHocDocs.map((doc, index) => (
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
          ))
        ) : (
          <p className="text-sm text-center py-8 text-slate-500">No ad-hoc documents have been uploaded for this case.</p>
        )}
      </div>
    </div>
  );
}