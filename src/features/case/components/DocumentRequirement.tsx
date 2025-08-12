// =================================================================================
// FILE: src/features/case/components/DocumentRequirement.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { FileText, Link as LinkIcon, History, Plus, Info, MessageSquare, AlertCircle, Clock, Calendar } from 'lucide-react';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import type { ChecklistDocument } from '../utils/checklist';
import { WithPermission } from '@/features/rbac/WithPermission';
import { AddVersionForm } from './AddVersionForm';
import type { ScannerProfile } from '@/types/entities';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface Props {
  document: ChecklistDocument;
  scannerProfiles: ScannerProfile[];
  isSelected: boolean;
  onSelect: (doc: ChecklistDocument) => void;
  onLink: (doc: ChecklistDocument) => void;
  onUpload: (doc: ChecklistDocument, details: { expiryDate: string; comments: string; file?: File }) => void;
  onScan: (
    doc: ChecklistDocument,
    details: { expiryDate: string; comments: string; scanDetails: Record<string, unknown> },
  ) => Promise<ScanResponse>;
  onShowHistory: (doc: ChecklistDocument) => void;
  onPreview: (doc: ChecklistDocument) => void;
}

// New component for expiry indicator
function ExpiryIndicator({ expiryDate }: { expiryDate: string }) {
  const date = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 font-medium">
        <AlertCircle size={10} /> EXPIRED
      </span>
    );
  } else if (daysUntilExpiry === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 font-medium">
        <AlertCircle size={10} /> Expires Today
      </span>
    );
  } else if (daysUntilExpiry <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
        <Clock size={10} /> {daysUntilExpiry}d left
      </span>
    );
  } else if (daysUntilExpiry <= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
        <Calendar size={10} /> {Math.floor(daysUntilExpiry / 30)}m left
      </span>
    );
  }
  return null;
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
  const [showFullComment, setShowFullComment] = useState(false);
  const elementId = `doc-${document.ownerId}-${document.name.replace(/[\s/]/g, '-')}`;

  const handleSaveUpload = (d: { expiryDate: string; comments: string; file?: File }) => {
    onUpload(document, d);
    setIsAdding(false);
  };
  
  const handleSaveScan = async (d: {
    expiryDate: string;
    comments: string;
    scanDetails: Record<string, unknown>;
  }): Promise<ScanResponse> => {
    const result = await onScan(document, d);
    setIsAdding(false);
    return result;
  };

  const canAddNewVersion = !isAdding;

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();

  return (
    <div
      id={elementId}
      className={`border-b border-gray-200 dark:border-slate-700 last:border-b-0 transition-all duration-300 ${
        isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : ''
      }`}
    >
      <div
        onClick={() => onPreview(document)}
        className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
      >
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onSelect(document)}
            className="h-4 w-4 rounded border-gray-300 dark:bg-slate-900 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {document.name}
              </span>
              {document.expiryDate && (
                <span className={`text-xs ${isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                  (Expires: {formatExpiryDate(document.expiryDate)})
                </span>
              )}
            </div>
            
            {document.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{document.description}</p>
            )}
            
            {document.comments && (
              <div className="mt-1">
                <p className={`text-xs text-slate-600 dark:text-slate-400 italic ${!showFullComment ? 'truncate' : ''}`}>
                  <span className="font-medium not-italic">Note:</span> {document.comments}
                </p>
                {document.comments.length > 80 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullComment(!showFullComment);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                  >
                    {showFullComment ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
            
            {document.rejectionReason && (
              <p className="text-xs text-red-500 mt-0.5">
                <span className="font-medium">Rejected:</span> {document.rejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          <DocStatusBadge status={document.status} />

          {document.expiryDate && document.status === 'Verified' && (
            <ExpiryIndicator expiryDate={document.expiryDate} />
          )}

          {document.validityMonths && (
            <span
              title={`Must be issued within ${document.validityMonths} month(s)`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
            >
              <Info size={10} /> {document.validityMonths}m validity
            </span>
          )}

          {document.comments && (
            <div className="group relative">
              <div className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <MessageSquare size={14} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div className="absolute hidden group-hover:block z-20 w-64 p-3 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-xl -top-2 right-full mr-2 transform -translate-y-full">
                <div className="absolute right-[-6px] top-1/2 transform -translate-y-1/2 rotate-45 w-3 h-3 bg-slate-800 dark:bg-slate-900"></div>
                <p className="font-medium mb-1">Comments:</p>
                <p className="text-slate-200">{document.comments}</p>
              </div>
            </div>
          )}

<WithPermission permission="document:read">
  {document.allVersions && (
    <button
      onClick={() => onShowHistory(document)}
      title="View version history"
      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      <History size={16} />
    </button>
  )}
</WithPermission>
          <>
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
            <WithPermission permission="document:upload">
            {canAddNewVersion && (
              <button
                onClick={() => setIsAdding(true)}
                title={document.status === 'Missing' ? 'Upload document' : 'Add new version'}
                className={`p-2 rounded-md transition-colors ${
                  document.status === 'Missing' || document.status === 'Rejected'
                    ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500'
                }`}
              >
                <Plus size={16} />
              </button>
            )}
            </WithPermission>
          </>
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
