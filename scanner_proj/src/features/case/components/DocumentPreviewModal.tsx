// =================================================================================
// FILE: src/features/case/components/DocumentPreviewModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChecklistDocument } from '../utils/checklist';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ChecklistDocument[];
  startIndex: number;
}

export function DocumentPreviewModal({ isOpen, onClose, documents, startIndex }: DocumentPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Effect to reset the index when the modal is opened with a new start index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  if (!isOpen || documents.length === 0) return null;

  const currentDoc = documents[currentIndex];
  if (!currentDoc) return null;

  const goToNext = () => setCurrentIndex(prev => (prev + 1) % documents.length);
  const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + documents.length) % documents.length);
  const goToIndex = (index: number) => setCurrentIndex(index);

  const isImage = currentDoc.mimeType?.startsWith('image/');
  const isPdf = currentDoc.mimeType === 'application/pdf';

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="p-4 rounded-xl border w-full h-full flex flex-col bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{currentDoc.name} (v{currentDoc.version}) - {currentIndex + 1} of {documents.length}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Main Preview Area with Navigation Arrows */}
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
            {isImage && <div className="text-center p-8 flex flex-col items-center justify-center text-slate-500"><ImageIcon size={64} className="mb-4" /> <h4 className="text-lg font-semibold">Image Preview</h4> <p>A preview of the image would be rendered here.</p></div>}
            {isPdf && <div className="text-center p-8 flex flex-col items-center justify-center text-slate-500"><FileText size={64} className="mb-4" /> <h4 className="text-lg font-semibold">PDF Preview</h4> <p>An embedded PDF viewer would be rendered here.</p></div>}
            {!isImage && !isPdf && <div className="text-center p-8"><p>No preview available for this file type ({currentDoc.mimeType}).</p></div>}
            
            <button onClick={goToPrevious} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"><ChevronLeft size={24} /></button>
            <button onClick={goToNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"><ChevronRight size={24} /></button>
          </div>

          {/* Right Sidebar: Trackable List */}
          <div className="w-64 flex-shrink-0 flex flex-col">
            <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Documents</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {documents.map((doc, index) => (
                <button
                  key={`${doc.id}-${index}`}
                  onClick={() => goToIndex(index)}
                  className={`w-full p-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
                      : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.ownerName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}