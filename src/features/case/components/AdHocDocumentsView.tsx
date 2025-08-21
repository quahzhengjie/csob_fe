// // src/features/case/components/AdHocDocumentsView.tsx

// 'use client';

// import React, { useState, useMemo } from 'react';
// import { DocumentRequirement } from './DocumentRequirement';
// import { DocumentPreviewModal } from './DocumentPreviewModal';
// import type { ScannerProfile, Document, Case } from '@/types/entities';
// import type { ChecklistDocument } from '../utils/checklist';
// import { Plus, Search, X, FileText } from 'lucide-react';

// interface AdHocDocumentsViewProps {
//     caseData: Case;
//     documents: Document[];  // Changed from optional to required since we're using flat structure
//     scannerProfiles: ScannerProfile[];
//     onLinkDocument: (doc: ChecklistDocument) => void;
//     onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
//     onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<{ documentId?: string; status?: string; message?: string }>;
//     onShowHistory: (doc: ChecklistDocument) => void;
// }

// const DOCUMENT_TYPES = {
//   'Identity & Personal': ['Passport', 'National ID Card', 'Driver\'s License', 'Birth Certificate', 'Power of Attorney'],
//   'Address Verification': ['Utility Bill', 'Bank Statement', 'Rental Agreement', 'Telephone Bill'],
//   'Income & Employment': ['Salary Slip', 'Employment Letter', 'Tax Return', 'Financial Statements', 'Auditor\'s Report'],
//   'Banking & Financial': ['Account Opening Form', 'KYC Form', 'Signature Card', 'Wire Transfer Form', 'Loan Application', 'Credit Report'],
//   'Legal & Compliance': ['Board Resolution', 'Memorandum of Association', 'Certificate of Good Standing', 'Trust Deed', 'Source of Funds Declaration'],
//   'Other Documents': ['Reference Letter', 'Consent Form', 'Affidavit', 'Custom Document']
// };

// export function AdHocDocumentsView({
//   caseData,
//   documents,
//   scannerProfiles,
//   onLinkDocument,
//   onUploadDocument,
//   onScan,
//   onShowHistory
// }: AdHocDocumentsViewProps) {
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [selectedDocType, setSelectedDocType] = useState<string>('');
//   const [customDocName, setCustomDocName] = useState<string>('');
//   const [searchTerm, setSearchTerm] = useState<string>('');
//   const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
//   const [newAdHocDocs, setNewAdHocDocs] = useState<ChecklistDocument[]>([]);

//   // Transform flat documents to ChecklistDocument format for ad-hoc documents
//   const existingAdHocDocs: ChecklistDocument[] = useMemo(() => {
//     if (!documents) return [];
    
//     // Filter ad-hoc documents for this case
//     const adHocDocs = documents.filter(d => 
//       d.ownerId === caseData.caseId && 
//       d.isAdHoc === true
//     );

//     // Group documents by type to get all versions
//     const docsByType = new Map<string, Document[]>();
//     adHocDocs.forEach(doc => {
//       const existing = docsByType.get(doc.documentType) || [];
//       existing.push(doc);
//       docsByType.set(doc.documentType, existing);
//     });

//     // Transform to ChecklistDocument format
//     const checklistDocs: ChecklistDocument[] = [];
//     docsByType.forEach((versions, docType) => {
//       // Sort versions by version number (descending)
//       const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
      
//       // Find the current version (either marked as current or the latest)
//       const currentVersion = sortedVersions.find(v => v.isCurrentForCase) || sortedVersions[0];
      
//       if (currentVersion) {
//         checklistDocs.push({
//           id: currentVersion.id.toString(),
//           name: docType,
//           required: false,
//           status: currentVersion.status,
//           ownerId: caseData.caseId,
//           ownerName: caseData.entity.entityName,
//           version: currentVersion.version,
//           uploadedDate: currentVersion.uploadedDate,
//           expiryDate: currentVersion.expiryDate || undefined,
//           mimeType: currentVersion.mimeType,
//           rejectionReason: currentVersion.rejectionReason || undefined,
//           comments: currentVersion.comments || undefined,
//           uploadedBy: currentVersion.uploadedBy || undefined,
//           verifiedBy: currentVersion.verifiedBy || undefined,
//           verifiedDate: currentVersion.verifiedDate || undefined,
//           allVersions: sortedVersions, // Store all versions for history
//           isAdHoc: true
//         });
//       }
//     });

//     return checklistDocs;
//   }, [documents, caseData.caseId, caseData.entity.entityName]);

//   const displayDocs = useMemo(() => [...existingAdHocDocs, ...newAdHocDocs], [existingAdHocDocs, newAdHocDocs]);
//   const previewableDocs = useMemo(() => displayDocs.filter(doc => doc.status !== 'Missing'), [displayDocs]);

//   const filteredCategories = useMemo(() => {
//     if (!searchTerm) return DOCUMENT_TYPES;
//     const filtered: Record<string, string[]> = {};
//     Object.entries(DOCUMENT_TYPES).forEach(([category, types]) => {
//       const matchingTypes = types.filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()));
//       if (matchingTypes.length > 0) {
//         filtered[category] = matchingTypes;
//       }
//     });
//     return filtered;
//   }, [searchTerm]);

//   const handleCreateDocument = () => {
//     const docName = selectedDocType === 'Custom Document' ? customDocName : selectedDocType;
//     if (!docName) return;

//     const newDoc: ChecklistDocument = {
//       id: `new-adhoc-${Date.now()}`,
//       name: docName,
//       required: false,
//       status: 'Missing',
//       ownerId: caseData.caseId, // Use caseId as owner for ad-hoc docs
//       ownerName: caseData.entity.entityName,
//       isAdHoc: true
//     };
//     setNewAdHocDocs(prev => [...prev, newDoc]);
//     handleModalClose();
//   };

//   const handleUploadComplete = (doc: ChecklistDocument) => {
//     setNewAdHocDocs(prev => prev.filter(d => d.id !== doc.id));
//   };

//   const handleDocPreview = (doc: ChecklistDocument) => {
//     const docIndex = previewableDocs.findIndex(d => d.id === doc.id);
//     if (docIndex !== -1) {
//       setPreviewState({ isOpen: true, startIndex: docIndex });
//     }
//   };

//   const handleModalClose = () => {
//     setShowUploadModal(false);
//     setSelectedDocType('');
//     setCustomDocName('');
//     setSearchTerm('');
//   };

//   // Custom history handler that uses the allVersions from the checklist document
//   const handleShowHistory = (doc: ChecklistDocument) => {
//     if (doc.allVersions && doc.allVersions.length > 0) {
//       // Use the versions stored in the checklist document
//       onShowHistory(doc);
//     } else {
//       // Fallback to finding versions from the documents array
//       const versions = documents.filter(d => 
//         d.ownerId === doc.ownerId && 
//         d.documentType === doc.name
//       );
      
//       if (versions.length > 0) {
//         onShowHistory({
//           ...doc,
//           allVersions: versions
//         });
//       }
//     }
//   };

//   return (
//     <>
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Ad-Hoc Documents</h3>
//           <button
//             onClick={() => setShowUploadModal(true)}
//             className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
//           >
//             <Plus size={16} />
//             Add Document
//           </button>
//         </div>

//         <div className="rounded-xl border border-gray-200 dark:border-slate-700">
//           {displayDocs.length > 0 ? (
//             <div className="divide-y divide-gray-200 dark:divide-slate-700">
//               {displayDocs.map((doc, index) => (
//                 <div key={doc.id || index} className="p-2">
//                   <DocumentRequirement
//                     document={doc}
//                     scannerProfiles={scannerProfiles}
//                     isSelected={false}
//                     onSelect={() => {}}
//                     onLink={onLinkDocument}
//                     onUpload={(uploadedDoc, details) => {
//                       onUploadDocument(uploadedDoc, details);
//                       handleUploadComplete(uploadedDoc);
//                     }}
//                     onScan={onScan}
//                     onShowHistory={handleShowHistory}
//                     onPreview={handleDocPreview}
//                   />
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="p-8 text-center">
//               <FileText className="mx-auto h-12 w-12 text-gray-400" />
//               <p className="mt-2 text-sm text-slate-500">No ad-hoc documents have been uploaded.</p>
//               <button
//                 onClick={() => setShowUploadModal(true)}
//                 className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
//               >
//                 Upload the first document
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {showUploadModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
//             <div className="p-6 border-b dark:border-slate-700">
//               <div className="flex justify-between items-center">
//                 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Document Type</h3>
//                 <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
//               </div>
//               <div className="mt-4 relative">
//                 <input
//                   type="text"
//                   placeholder="Search document types..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full px-4 py-2 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
//                 />
//                 <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
//               </div>
//             </div>

//             <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
//               {Object.entries(filteredCategories).map(([category, types]) => (
//                 <div key={category} className="mb-6">
//                   <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{category}</h4>
//                   <div className="grid grid-cols-2 gap-2">
//                     {types.map(type => (
//                       <button
//                         key={type}
//                         onClick={() => setSelectedDocType(type)}
//                         className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedDocType === type ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
//                       >
//                         {type}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {selectedDocType === 'Custom Document' && (
//               <div className="px-6 pb-4">
//                 <input
//                   type="text"
//                   placeholder="Enter custom document name..."
//                   value={customDocName}
//                   onChange={(e) => setCustomDocName(e.target.value)}
//                   className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
//                   autoFocus
//                 />
//               </div>
//             )}

//             <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3">
//               <button
//                 onClick={handleModalClose}
//                 className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCreateDocument}
//                 disabled={!selectedDocType || (selectedDocType === 'Custom Document' && !customDocName.trim())}
//                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Continue to Upload
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <DocumentPreviewModal
//         isOpen={previewState.isOpen}
//         onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })}
//         documents={previewableDocs}
//         startIndex={previewState.startIndex}
//       />
//     </>
//   );
// }
// src/features/case/components/AdHocDocumentsView.tsx
// Using DocumentChecklist component like CreditDetailsView does

'use client';

import React, { useState, useMemo } from 'react';
import { DocumentChecklist } from './DocumentChecklist';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import type { ScannerProfile, Document, Case, Party } from '@/types/entities';
import type { ChecklistDocument, ChecklistSection } from '../utils/checklist';
import { Plus, Search, X } from 'lucide-react';

interface AdHocDocumentsViewProps {
    caseData: Case;
    documents: Document[];
    parties: Party[];  // Add parties prop like DocumentChecklist expects
    scannerProfiles: ScannerProfile[];
    onLinkDocument: (doc: ChecklistDocument) => void;
    onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
    onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<{ documentId?: string; status?: string; message?: string }>;
    onShowHistory: (doc: ChecklistDocument) => void;
    onPreview: (doc: ChecklistDocument) => void;
}

const DOCUMENT_TYPES = {
  'Identity & Personal': ['Passport', 'National ID Card', 'Driver\'s License', 'Birth Certificate', 'Power of Attorney'],
  'Address Verification': ['Utility Bill', 'Bank Statement', 'Rental Agreement', 'Telephone Bill'],
  'Income & Employment': ['Salary Slip', 'Employment Letter', 'Tax Return', 'Financial Statements', 'Auditor\'s Report'],
  'Banking & Financial': ['Account Opening Form', 'KYC Form', 'Signature Card', 'Wire Transfer Form', 'Loan Application', 'Credit Report'],
  'Legal & Compliance': ['Board Resolution', 'Memorandum of Association', 'Certificate of Good Standing', 'Trust Deed', 'Source of Funds Declaration'],
  'Other Documents': ['Reference Letter', 'Consent Form', 'Affidavit', 'Custom Document']
};

export function AdHocDocumentsView({
  caseData,
  documents,
  parties,
  scannerProfiles,
  onLinkDocument,
  onUploadDocument,
  onScan,
  onShowHistory
}: AdHocDocumentsViewProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [customDocName, setCustomDocName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
  const [newAdHocDocs, setNewAdHocDocs] = useState<ChecklistDocument[]>([]);

  // Transform flat documents to ChecklistSection format for ad-hoc documents
  const adHocChecklist: ChecklistSection[] = useMemo(() => {
    if (!documents) return [{ category: 'Ad-Hoc Documents', documents: [] }];
    
    // Filter ad-hoc documents for this case
    const adHocDocs = documents.filter(d => 
      d.ownerId === caseData.caseId && 
      d.isAdHoc === true
    );

    // Group documents by type to get all versions
    const docsByType = new Map<string, Document[]>();
    adHocDocs.forEach(doc => {
      const existing = docsByType.get(doc.documentType) || [];
      existing.push(doc);
      docsByType.set(doc.documentType, existing);
    });

    // Transform to ChecklistDocument format
    const checklistDocs: ChecklistDocument[] = [];
    
    // Process existing ad-hoc documents
    docsByType.forEach((versions, docType) => {
      // Sort versions by version number (descending)
      const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
      
      // Find the current version (either marked as current or the latest)
      const currentVersion = sortedVersions.find(v => v.isCurrentForCase) || sortedVersions[0];
      
      if (currentVersion) {
        checklistDocs.push({
          id: currentVersion.id.toString(),
          documentId: currentVersion.id,  // Add documentId for download functionality
          name: docType, 
          required: false,
          status: currentVersion.status,
          ownerId: caseData.caseId,
          ownerName: caseData.entity.entityName,
          version: currentVersion.version,
          uploadedDate: currentVersion.uploadedDate,
          expiryDate: currentVersion.expiryDate || undefined,
          mimeType: currentVersion.mimeType,
          rejectionReason: currentVersion.rejectionReason || undefined,
          comments: currentVersion.comments || undefined,
          uploadedBy: currentVersion.uploadedBy || undefined,
          verifiedBy: currentVersion.verifiedBy || undefined,
          verifiedDate: currentVersion.verifiedDate || undefined,
          allVersions: sortedVersions, // Store all versions for history
          isAdHoc: true,
          category: 'CUSTOMER' // Add category for DocumentChecklist grouping
        });
      }
    });

    // Add new ad-hoc documents that haven't been uploaded yet
    newAdHocDocs.forEach(doc => {
      checklistDocs.push({
        ...doc,
        category: 'CUSTOMER' // Add category for DocumentChecklist grouping
      });
    });

    // Return as a single section matching ChecklistSection type
    return [{
      category: 'Ad-Hoc Documents',
      documents: checklistDocs
    }];
  }, [documents, caseData, newAdHocDocs]);

  // Get all ad-hoc documents that can be previewed (not missing)
  const allAdHocDocs = useMemo(() => 
    adHocChecklist.flatMap(section => section.documents).filter(doc => doc.status !== 'Missing'),
    [adHocChecklist]
  );

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return DOCUMENT_TYPES;
    const filtered: Record<string, string[]> = {};
    Object.entries(DOCUMENT_TYPES).forEach(([category, types]) => {
      const matchingTypes = types.filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()));
      if (matchingTypes.length > 0) {
        filtered[category] = matchingTypes;
      }
    });
    return filtered;
  }, [searchTerm]);

  const handleCreateDocument = () => {
    const docName = selectedDocType === 'Custom Document' ? customDocName : selectedDocType;
    if (!docName) return;

    const newDoc: ChecklistDocument = {
      id: `new-adhoc-${Date.now()}`,
      name: docName,
      required: false,
      status: 'Missing',
      ownerId: caseData.caseId,
      ownerName: caseData.entity.entityName,
      isAdHoc: true
    };
    setNewAdHocDocs(prev => [...prev, newDoc]);
    handleModalClose();
  };

  // Handle document preview
  const handleAdHocDocPreview = (doc: ChecklistDocument) => {
    if (doc.status === 'Missing') return;
    
    const docIndex = allAdHocDocs.findIndex(d => d.id === doc.id && d.name === doc.name);
    if (docIndex !== -1) {
      setPreviewState({ isOpen: true, startIndex: docIndex });
    }
  };

  // Custom history handler that includes all versions
  const handleShowHistoryWithVersions = (doc: ChecklistDocument) => {
    if (doc.allVersions && doc.allVersions.length > 0) {
      onShowHistory(doc);
    } else {
      // Fallback to finding versions from the documents array
      const versions = documents.filter(d => 
        d.ownerId === doc.ownerId && 
        d.documentType === doc.name &&
        d.isAdHoc === true
      );
      
      if (versions.length > 0) {
        onShowHistory({
          ...doc,
          allVersions: versions
        });
      }
    }
  };

  // Custom upload handler that removes from newAdHocDocs after upload
  const handleUploadDocument = (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => {
    onUploadDocument(doc, details);
    // Remove from newAdHocDocs if it was a newly created doc
    if (doc.id?.startsWith('new-adhoc-')) {
      setNewAdHocDocs(prev => prev.filter(d => d.id !== doc.id));
    }
  };

  const handleModalClose = () => {
    setShowUploadModal(false);
    setSelectedDocType('');
    setCustomDocName('');
    setSearchTerm('');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Ad-Hoc Documents</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Document
          </button>
        </div>

        {/* Use DocumentChecklist component for consistency and all features */}
        <DocumentChecklist
          checklist={adHocChecklist}
          scannerProfiles={scannerProfiles}
          isChecklistTab={false}          // No title (you already have "Ad-Hoc Documents")
          showCategoryGrouping={false}     // Simple flat list
          parties={parties}
          caseData={caseData}
          onLinkDocument={onLinkDocument}
          onUploadDocument={handleUploadDocument}
          onScan={onScan}
          onShowHistory={handleShowHistoryWithVersions}
          onPreview={handleAdHocDocPreview}
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b dark:border-slate-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Document Type</h3>
                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="mt-4 relative">
                <input
                  type="text"
                  placeholder="Search document types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {Object.entries(filteredCategories).map(([category, types]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {types.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedDocType(type)}
                        className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedDocType === type 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedDocType === 'Custom Document' && (
              <div className="px-6 pb-4">
                <input
                  type="text"
                  placeholder="Enter custom document name..."
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  autoFocus
                />
              </div>
            )}

            <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!selectedDocType || (selectedDocType === 'Custom Document' && !customDocName.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad-Hoc Documents Preview Modal */}
      <DocumentPreviewModal 
        isOpen={previewState.isOpen} 
        onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })} 
        documents={allAdHocDocs} 
        startIndex={previewState.startIndex} 
      />
    </>
  );
}