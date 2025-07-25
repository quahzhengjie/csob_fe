// =================================================================================
// FILE: src/features/case/components/DocumentChecklist.tsx
// =================================================================================
'use client';

// REMOVED: No longer need useEffect
import React, { useState } from 'react';
import { ChevronDown, Download, Mail } from 'lucide-react';
import type { Case, Party, Document, CaseDocumentLink, ScannerProfile } from '@/types/entities';
import { generateLiveChecklist, type ChecklistDocument } from '../utils/checklist';
import { DocumentRequirement } from './DocumentRequirement';

interface DocumentChecklistProps {
  caseData: Case;
  parties: Party[];
  documents: Document[];
  documentLinks: CaseDocumentLink[];
  scannerProfiles: ScannerProfile[];
  onLinkDocument: (doc: ChecklistDocument) => void;
  onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string }) => void;
  onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => void;
  onShowHistory: (doc: ChecklistDocument) => void;
  onPreview: (doc: ChecklistDocument) => void;
}

export function AccountDocumentChecklist({ caseData, parties, documents, documentLinks, scannerProfiles, onLinkDocument, onUploadDocument, onScan, onShowHistory, onPreview }: DocumentChecklistProps) {
  const { checklist } = generateLiveChecklist(caseData, parties, documents, documentLinks);
  const [selectedDocs, setSelectedDocs] = useState<ChecklistDocument[]>([]);

  // CORRECTED: Replaced the useEffect with a lazy initializer function for useState.
  // This function is guaranteed to run only once on the component's initial render.
  const [expandedSections, setExpandedSections] = useState(() => {
    const initialExpansionState: Record<string, boolean> = {};
    checklist.forEach(section => {
      initialExpansionState[section.category] = true;
    });
    return initialExpansionState;
  });

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSelectDocument = (doc: ChecklistDocument) => {
    setSelectedDocs(prev =>
      prev.some(selected => selected.id === doc.id && selected.name === doc.name)
        ? prev.filter(selected => !(selected.id === doc.id && selected.name === doc.name))
        : [...prev, doc]
    );
  };

  const handleDownloadSelected = () => {
    console.log("Downloading selected documents:", selectedDocs);
    alert(`Downloading ${selectedDocs.length} selected documents (see console).`);
    setSelectedDocs([]);
  };

  const handleDownloadAll = () => {
    const allAvailableDocs = checklist.flatMap(s => s.documents).filter(d => d.status === 'Verified' || d.status === 'Submitted');
    console.log("Downloading all available documents:", allAvailableDocs);
    alert(`Downloading all ${allAvailableDocs.length} available documents (see console).`);
  };

  const handleEmail = () => {
    alert("This would open an email modal.");
  };

  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Document Checklist</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={handleDownloadSelected}
                disabled={selectedDocs.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={14} /> Download Selected ({selectedDocs.length})
            </button>
            <button onClick={handleDownloadAll} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Download size={14} /> Download All
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-800">
                <Mail size={14} /> Email
            </button>
        </div>
      </div>
      <div className="space-y-6">
        {checklist.map((section) => (
          <div key={section.category}>
            <button onClick={() => toggleSection(section.category)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50">
              <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">{section.category}</h3>
              <ChevronDown size={20} className={`text-slate-500 transition-transform duration-200 ${expandedSections[section.category] ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections[section.category] && (
              <div className="mt-2 space-y-2 pl-4">
                {section.documents.map((doc) => (
                  <DocumentRequirement
                    key={`${doc.ownerId}-${doc.name}`}
                    document={doc}
                    onLink={onLinkDocument}
                    onUpload={onUploadDocument}
                    onScan={onScan}
                    onShowHistory={onShowHistory}
                    scannerProfiles={scannerProfiles}
                    isSelected={selectedDocs.some(selected => selected.id === doc.id && selected.name === doc.name)}
                    onSelect={handleSelectDocument}
                    onPreview={onPreview}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}