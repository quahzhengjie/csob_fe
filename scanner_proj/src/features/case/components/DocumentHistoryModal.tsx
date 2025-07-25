// =================================================================================
// FILE: src/features/case/components/DocumentHistoryModal.tsx
// =================================================================================
'use client';

import React from 'react';
import { X, History, RefreshCw } from 'lucide-react';
import type { Document, DocumentVersion } from '@/types/entities';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  currentVersionId?: string;
  onRevert: (documentId: string, version: DocumentVersion) => void;
}

export function DocumentHistoryModal({ isOpen, onClose, document, currentVersionId, onRevert }: DocumentHistoryModalProps) {
  if (!isOpen || !document) return null;
  const reversedVersions = [...document.versions].reverse();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-6 rounded-xl border w-full max-w-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"> <History size={20} /> Version History: {document.name} </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {reversedVersions.map((version) => {
            const isCurrent = version.id === currentVersionId;
            return (
              <div key={version.id} className={`p-4 rounded-lg border ${isCurrent ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 dark:border-slate-600"} bg-gray-50 dark:bg-slate-700/50`}>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Version {version.version}
                    {isCurrent && <span className="ml-2 text-xs font-normal text-blue-500">(Current)</span>}
                  </div>
                  <DocStatusBadge status={version.status} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2"> Uploaded on: {new Date(version.uploadedDate).toLocaleDateString()} </div>
                {version.rejectionReason && (<p className="text-sm text-red-500 mt-1">Reason: {version.rejectionReason}</p>)}
                <WithPermission permission="case:update">
                  {!isCurrent && (
                    <button onClick={() => onRevert(document.documentId, version)} className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-orange-500 hover:bg-orange-600">
                       <RefreshCw size={12}/> Make Current
                    </button>
                  )}
                </WithPermission>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600"> Close </button>
        </div>
      </div>
    </div>
  );
}