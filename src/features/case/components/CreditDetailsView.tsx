// Updated CreditDetailsView.tsx with correct handler types

'use client';

import React, { useMemo } from 'react';
import type { Case, ScannerProfile, Document } from '@/types/entities';
import type { ChecklistDocument, ChecklistSection } from '../utils/checklist';
import { DocumentChecklist } from './DocumentChecklist';
import { DocumentPreviewModal } from './DocumentPreviewModal';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface CreditDetailsViewProps {
    caseData: Case;
    documents: Document[];
    scannerProfiles: ScannerProfile[];
    onLinkDocument: (doc: ChecklistDocument) => void;
    onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
    onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
    onShowHistory: (doc: ChecklistDocument) => void;
    onPreview: (doc: ChecklistDocument) => void;
    // Updated to match CaseDetailView handlers
    onApprove?: (documentId: number, document: Document) => void;
    onReject?: (documentId: number, document: Document, reason: string) => void;
}

const InfoItem = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-md font-semibold text-slate-900 dark:text-slate-100">{value || '-'}</p>
    </div>
);

export function CreditDetailsView({ 
  caseData, 
  documents,
  scannerProfiles, 
  onLinkDocument, 
  onUploadDocument, 
  onScan, 
  onShowHistory
}: CreditDetailsViewProps) {
  const creditDetails = caseData.entity.creditDetails;
  const [previewState, setPreviewState] = React.useState<{ isOpen: boolean; startIndex: number }>({ 
    isOpen: false, 
    startIndex: 0 
  });

  // Generate the checklist sections with actual document status
  const creditChecklist: ChecklistSection[] = useMemo(() => {
    // MOVED INSIDE USEMEMO - This is the fix for the dependency warning
    const creditDocumentTemplates = [
      { name: 'Master Credit Agreement', required: true },
      { name: 'Financial Statements', required: true },
      { name: 'Credit Assessment Report', required: false },
      { name: 'Collateral Documentation', required: false }
    ];
  
    const creditDocs = creditDocumentTemplates.map(template => {
      // Find all documents of this type for the case
      const documentsOfType = documents.filter(d => 
        d.documentType === template.name && 
        d.ownerId === caseData.caseId
      );

      // Sort by version descending
      const sortedDocs = [...documentsOfType].sort((a, b) => b.version - a.version);
      
      // Find the current document (marked as current or latest version)
      const currentDoc = sortedDocs.find(d => d.isCurrentForCase) || sortedDocs[0];

      if (currentDoc) {
    
        
        // Transform to ChecklistDocument format
        return {
          id: currentDoc.id.toString(),
          documentId: currentDoc.id,
          name: template.name,
          required: template.required,
          status: currentDoc.status,
          ownerId: caseData.caseId,
          ownerName: caseData.entity.entityName,
          version: currentDoc.version,
          uploadedDate: currentDoc.uploadedDate,
          expiryDate: currentDoc.expiryDate || undefined,
          mimeType: currentDoc.mimeType,
          rejectionReason: currentDoc.rejectionReason || undefined,
          comments: currentDoc.comments || undefined,
          uploadedBy: currentDoc.uploadedBy,
          verifiedBy: currentDoc.verifiedBy,
          verifiedDate: currentDoc.verifiedDate || undefined,
          // Store all versions for this document type for history
          allVersions: sortedDocs
        } as ChecklistDocument;
      }

      // Document not uploaded yet
      return {
        id: `missing-${caseData.caseId}-${template.name}`,
        name: template.name,
        required: template.required,
        status: 'Missing' as const,
        ownerId: caseData.caseId,
        ownerName: caseData.entity.entityName
      } as ChecklistDocument;
    });

    // Return as a single section matching ChecklistSection type
    return [{
      category: 'Credit Documents',  // Required by ChecklistSection type
      documents: creditDocs
    }];
  }, [documents, caseData]); // Removed creditDocumentTemplates from dependencies

  // Get all credit documents that can be previewed (not missing)
  const allCreditDocs = useMemo(() => 
    creditChecklist.flatMap(section => section.documents).filter(doc => doc.status !== 'Missing'),
    [creditChecklist]
  );

  // Handle document preview
  const handleCreditDocPreview = (doc: ChecklistDocument) => {
    if (doc.status === 'Missing') return;
    
    const docIndex = allCreditDocs.findIndex(d => d.id === doc.id && d.name === doc.name);
    if (docIndex !== -1) {
      setPreviewState({ isOpen: true, startIndex: docIndex });
    }
  };

  // Custom history handler that includes all versions
  const handleShowHistoryWithVersions = (doc: ChecklistDocument) => {
    if (doc.allVersions && doc.allVersions.length > 0) {
      // Use the versions stored in the checklist document
      onShowHistory(doc);
    } else {
      // Fallback to finding versions from the documents array
      const versions = documents.filter(d => 
        d.ownerId === doc.ownerId && 
        d.documentType === doc.name
      );
      
      if (versions.length > 0) {
        onShowHistory({
          ...doc,
          allVersions: versions
        });
      }
    }
  };

  return (
    <>
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
                  <p className="mt-1 text-md text-slate-900 dark:text-slate-100">{creditDetails.assessmentNotes || 'No assessment notes available'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No credit details available for this case.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <DocumentChecklist
            checklist={creditChecklist}
            scannerProfiles={scannerProfiles}
            onLinkDocument={onLinkDocument}
            onUploadDocument={onUploadDocument}
            onScan={onScan}
            onShowHistory={handleShowHistoryWithVersions}
            onPreview={handleCreditDocPreview}
          />
        </div>
      </div>

      {/* Credit Documents Preview Modal */}
      <DocumentPreviewModal 
        isOpen={previewState.isOpen} 
        onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })} 
        documents={allCreditDocs} 
        startIndex={previewState.startIndex} 
      />
    </>
  );
}