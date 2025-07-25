// =================================================================================
// FILE: src/features/case/components/DocumentRequirement.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { FileText, Link as LinkIcon, History, Plus, Info } from 'lucide-react';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import type { ChecklistDocument } from '../utils/checklist';
import { WithPermission } from '@/features/rbac/WithPermission';
import { AddVersionForm } from './AddVersionForm';
import type { ScannerProfile } from '@/types/entities';

interface Props {
  document: ChecklistDocument;
  scannerProfiles: ScannerProfile[];
  isSelected: boolean;
  onSelect: (doc: ChecklistDocument) => void;
  onLink: (doc: ChecklistDocument) => void;
  onUpload: (doc: ChecklistDocument, details: { expiryDate: string; comments: string }) => void;
  onScan: (
    doc: ChecklistDocument,
    details: { expiryDate: string; comments: string; scanDetails: Record<string, unknown> },
  ) => void;
  onShowHistory: (doc: ChecklistDocument) => void;
  onPreview: (doc: ChecklistDocument) => void;
}

export function DocumentRequirement({
  document,
  scannerProfiles,
  isSelected,
  onSelect,
  onLink,
  onUpload,
  onScan,
  onShowHistory,
  onPreview,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const elementId = `doc-${document.ownerId}-${document.name.replace(/[\s/]/g, '-')}`;

  const handleSaveUpload = (d: { expiryDate: string; comments: string }) => {
    onUpload(document, d);
    setIsAdding(false);
  };
  const handleSaveScan = (d: {
    expiryDate: string;
    comments: string;
    scanDetails: Record<string, unknown>;
  }) => {
    onScan(document, d);
    setIsAdding(false);
  };

  return (
    <div
      id={elementId}
      className="border-b border-gray-200 dark:border-slate-700 last:border-b-0 transition-all duration-300"
    >
      {/* clickable row */}
      <div
        onClick={() => onPreview(document)}
        className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
      >
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onSelect(document)}
            className="h-4 w-4 rounded border-gray-300 dark:bg-slate-900 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />

          <div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {document.name}
            </span>
            {document.description && (
              <p className="text-xs text-slate-500">{document.description}</p>
            )}
            {document.rejectionReason && (
              <p className="text-xs text-red-500 mt-0.5">Rejected: {document.rejectionReason}</p>
            )}
          </div>
        </div>

        {/* right-side actions */}
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <DocStatusBadge status={document.status} />

          {document.validityMonths && (
            <span
              title={`Must be issued within ${document.validityMonths} month(s)`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
            >
              <Info size={10} /> {document.validityMonths} m
            </span>
          )}

          {document.allVersions && document.allVersions.length > 1 && (
            <button
              onClick={() => onShowHistory(document)}
              title="View version history"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <History size={16} />
            </button>
          )}

          {/* upload / link actions */}
          <WithPermission permission="document:upload">
            {document.status === 'Missing' && document.reusableDocument && (
              <div className="p-2 rounded-lg text-xs text-center bg-blue-50 dark:bg-blue-900/50">
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Verified version on file
                </p>
                <button
                  onClick={() => onLink(document)}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <LinkIcon size={12} /> Link to case
                </button>
              </div>
            )}

            {(document.status === 'Missing' || document.status === 'Rejected') &&
              !document.reusableDocument &&
              !isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  title="Add new version"
                  className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  <Plus size={16} />
                </button>
              )}
          </WithPermission>
        </div>
      </div>

      {isAdding && (
        <AddVersionForm
          onUpload={handleSaveUpload}
          onScan={handleSaveScan}
          onCancel={() => setIsAdding(false)}
          scannerProfiles={scannerProfiles}
        />
      )}
    </div>
  );
}
