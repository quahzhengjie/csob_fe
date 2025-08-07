// // =================================================================================
// // FILE: src/features/case/components/DocumentPreviewModal.tsx
// // =================================================================================
// 'use client';

// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { X, FileText, ChevronLeft, ChevronRight, Download, ExternalLink, File, Image as ImageIcon, FileSpreadsheet, FileType, Presentation } from 'lucide-react';
// import type { ChecklistDocument } from '../utils/checklist';
// import Image from 'next/image';

// interface DocumentPreviewModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   documents: ChecklistDocument[];
//   startIndex: number;
// }

// export function DocumentPreviewModal({ isOpen, onClose, documents, startIndex }: DocumentPreviewModalProps) {
//   const [currentIndex, setCurrentIndex] = useState(startIndex);
//   const [isLoading, setIsLoading] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const previousUrlRef = useRef<string | null>(null);

//   // Effect to reset the index when the modal is opened with a new start index
//   useEffect(() => {
//     if (isOpen) {
//       setCurrentIndex(startIndex);
//     }
//   }, [isOpen, startIndex]);

//   const loadDocumentPreview = useCallback(async (doc: ChecklistDocument) => {
//     if (!doc.masterDocumentId || doc.status === 'Missing') {
//       setPreviewUrl(null);
//       setError('Document not available for preview');
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       // Parse the document ID to ensure it's numeric for the backend
//       const docId = parseInt(doc.masterDocumentId);
//       if (isNaN(docId)) {
//         throw new Error('Invalid document ID');
//       }

//       // Fetch the document from your API
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/documents/download/${docId}`, {
//         credentials: 'include',
//         headers: {
//           'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_API_USERNAME || 'admin'}:${process.env.NEXT_PUBLIC_API_PASSWORD || 'password123'}`)}`
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to load document');
//       }

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
      
//       // Clean up previous URL before setting new one
//       if (previousUrlRef.current) {
//         URL.revokeObjectURL(previousUrlRef.current);
//       }
      
//       previousUrlRef.current = url;
//       setPreviewUrl(url);
//     } catch (err) {
//       console.error('Error loading document:', err);
//       setError('Failed to load document preview');
//       setPreviewUrl(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Load document preview when current document changes
//   useEffect(() => {
//     if (isOpen && documents[currentIndex]) {
//       loadDocumentPreview(documents[currentIndex]);
//     }
//   }, [currentIndex, isOpen, documents, loadDocumentPreview]);

//   // Cleanup on unmount or when modal closes
//   useEffect(() => {
//     return () => {
//       if (previousUrlRef.current) {
//         URL.revokeObjectURL(previousUrlRef.current);
//         previousUrlRef.current = null;
//       }
//     };
//   }, []);

//   const getFileTypeInfo = (mimeType?: string) => {
//     if (!mimeType) return { type: 'unknown', icon: File, color: 'text-gray-500', canPreview: false };
    
//     if (mimeType === 'application/pdf') {
//       return { type: 'PDF', icon: FileText, color: 'text-red-500', canPreview: true };
//     }
//     if (mimeType.startsWith('image/')) {
//       return { type: 'Image', icon: ImageIcon, color: 'text-blue-500', canPreview: true };
//     }
//     if (mimeType.includes('word') || mimeType.includes('document')) {
//       return { type: 'Word', icon: FileText, color: 'text-blue-600', canPreview: false };
//     }
//     if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
//       return { type: 'Excel', icon: FileSpreadsheet, color: 'text-green-600', canPreview: false };
//     }
//     if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
//       return { type: 'PowerPoint', icon: Presentation, color: 'text-orange-600', canPreview: false };
//     }
//     if (mimeType === 'text/plain' || mimeType === 'text/csv') {
//       return { type: 'Text', icon: FileType, color: 'text-gray-600', canPreview: true };
//     }
    
//     return { type: 'Document', icon: File, color: 'text-gray-500', canPreview: false };
//   };

//   if (!isOpen || documents.length === 0) return null;

//   const currentDoc = documents[currentIndex];
//   if (!currentDoc) return null;

//   const goToNext = () => setCurrentIndex(prev => (prev + 1) % documents.length);
//   const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + documents.length) % documents.length);
//   const goToIndex = (index: number) => setCurrentIndex(index);

//   const fileTypeInfo = getFileTypeInfo(currentDoc.mimeType);
//   const isImage = currentDoc.mimeType?.startsWith('image/');
//   const isPdf = currentDoc.mimeType === 'application/pdf';
//   const isText = currentDoc.mimeType === 'text/plain';

//   const getFileExtension = (mimeType?: string) => {
//     if (!mimeType) return '';
//     const extensions: Record<string, string> = {
//       'application/pdf': '.pdf',
//       'application/msword': '.doc',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
//       'application/vnd.ms-excel': '.xls',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
//       'application/vnd.ms-powerpoint': '.ppt',
//       'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
//       'text/plain': '.txt',
//       'text/csv': '.csv',
//       'image/jpeg': '.jpg',
//       'image/png': '.png',
//       'image/gif': '.gif',
//     };
//     return extensions[mimeType] || '';
//   };

//   const handleDownload = async () => {
//     if (!currentDoc.masterDocumentId) return;
    
//     try {
//       // Parse the document ID to ensure it's numeric for the backend
//       const docId = parseInt(currentDoc.masterDocumentId);
//       if (isNaN(docId)) {
//         throw new Error('Invalid document ID');
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/documents/download/${docId}`, {
//         credentials: 'include',
//         headers: {
//           'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_API_USERNAME || 'admin'}:${process.env.NEXT_PUBLIC_API_PASSWORD || 'password123'}`)}`
//         }
//       });

//       if (!response.ok) throw new Error('Download failed');

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = currentDoc.name + getFileExtension(currentDoc.mimeType);
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error('Download error:', err);
//       alert('Failed to download document');
//     }
//   };

//   const handleOpenInNewTab = () => {
//     if (previewUrl) {
//       window.open(previewUrl, '_blank');
//     }
//   };

//   const renderPreviewContent = () => {
//     if (isLoading) {
//       return (
//         <div className="text-center p-8">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-slate-500">Loading document...</p>
//         </div>
//       );
//     }

//     if (error) {
//       return (
//         <div className="text-center p-8">
//           <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
//             <X className="h-8 w-8 text-red-500" />
//           </div>
//           <p className="text-red-500 mb-4">{error}</p>
//           <button 
//             onClick={handleDownload}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Download Document
//           </button>
//         </div>
//       );
//     }

//     if (!previewUrl && currentDoc.status === 'Missing') {
//       return (
//         <div className="text-center p-8">
//           <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
//             <FileText size={32} className="text-gray-400" />
//           </div>
//           <p className="text-slate-500">Document not yet uploaded</p>
//         </div>
//       );
//     }

//     if (!previewUrl) return null;

//     // Handle different file types
//     if (isImage) {
//       return (
//         <div className="relative w-full h-full flex items-center justify-center">
//           <Image 
//             src={previewUrl} 
//             alt={currentDoc.name}
//             fill
//             className="object-contain"
//             sizes="(max-width: 1024px) 100vw, 70vw"
//             priority
//           />
//         </div>
//       );
//     }

//     if (isPdf) {
//       return (
//         <iframe
//           src={previewUrl}
//           className="w-full h-full"
//           title={currentDoc.name}
//         />
//       );
//     }

//     if (isText) {
//       return (
//         <div className="w-full h-full p-4 overflow-auto">
//           <iframe
//             src={previewUrl}
//             className="w-full h-full border-0"
//             title={currentDoc.name}
//           />
//         </div>
//       );
//     }

//     // For non-previewable files (Office docs, etc.)
//     return (
//       <div className="text-center p-8">
//         <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
//           <fileTypeInfo.icon size={40} className={fileTypeInfo.color} />
//         </div>
//         <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
//           {fileTypeInfo.type} Document
//         </h3>
//         <p className="text-slate-500 mb-6">
//           Preview not available for this file type.<br />
//           Download the document to view its contents.
//         </p>
//         <div className="flex justify-center gap-3">
//           <button 
//             onClick={handleDownload}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
//           >
//             <Download size={16} />
//             Download to View
//           </button>
//           {previewUrl && (
//             <button 
//               onClick={handleOpenInNewTab}
//               className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
//             >
//               <ExternalLink size={16} />
//               Open in New Tab
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
//       <div onClick={(e) => e.stopPropagation()} className="p-4 rounded-xl border w-full h-full flex flex-col bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
//         <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
//           <div className="flex-1">
//             <div className="flex items-center gap-3">
//               <fileTypeInfo.icon className={`h-6 w-6 ${fileTypeInfo.color}`} />
//               <div>
//                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">
//                   {currentDoc.name} {currentDoc.version && `(v${currentDoc.version})`}
//                 </h3>
//                 <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
//                   <span>Document {currentIndex + 1} of {documents.length}</span>
//                   <span>•</span>
//                   <span>{currentDoc.ownerName}</span>
//                   <span>•</span>
//                   <span className={`px-2 py-1 rounded text-xs font-medium ${fileTypeInfo.color} bg-gray-100 dark:bg-gray-800`}>
//                     {fileTypeInfo.type}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             {currentDoc.status !== 'Missing' && (
//               <>
//                 <button 
//                   onClick={handleDownload}
//                   className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
//                   title="Download"
//                 >
//                   <Download className="h-5 w-5" />
//                 </button>
//                 {previewUrl && fileTypeInfo.canPreview && (
//                   <button 
//                     onClick={handleOpenInNewTab}
//                     className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
//                     title="Open in new tab"
//                   >
//                     <ExternalLink className="h-5 w-5" />
//                   </button>
//                 )}
//               </>
//             )}
//             <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
//               <X className="h-5 w-5" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 flex gap-4 overflow-hidden">
//           {/* Main Preview Area with Navigation Arrows */}
//           <div className="relative flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
//             {renderPreviewContent()}
            
//             <button 
//               onClick={goToPrevious} 
//               className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={documents.length <= 1}
//             >
//               <ChevronLeft size={24} />
//             </button>
//             <button 
//               onClick={goToNext} 
//               className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={documents.length <= 1}
//             >
//               <ChevronRight size={24} />
//             </button>
//           </div>

//           {/* Right Sidebar: Document List */}
//           <div className="w-64 flex-shrink-0 flex flex-col">
//             <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Documents</h4>
//             <div className="flex-1 overflow-y-auto space-y-2 pr-2">
//               {documents.map((doc, index) => {
//                 const docTypeInfo = getFileTypeInfo(doc.mimeType);
//                 return (
//                   <button
//                     key={`${doc.id}-${index}`}
//                     onClick={() => goToIndex(index)}
//                     className={`w-full p-3 text-left rounded-lg flex items-center gap-3 transition-colors ${
//                       index === currentIndex
//                         ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
//                         : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
//                     }`}
//                   >
//                     <docTypeInfo.icon className={`h-5 w-5 flex-shrink-0 ${docTypeInfo.color}`} />
//                     <div className="flex-1 overflow-hidden">
//                       <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">{doc.name}</p>
//                       <div className="flex items-center gap-2 text-xs text-slate-500">
//                         <span>{doc.ownerName}</span>
//                         <span>•</span>
//                         <span>{docTypeInfo.type}</span>
//                       </div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// =================================================================================
// FILE: src/features/case/components/DocumentPreviewModal.tsx
// =================================================================================
// =================================================================================
// FILE: src/features/case/components/DocumentPreviewModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, FileText, ChevronLeft, ChevronRight, Download, ExternalLink, File, Image as ImageIcon, FileSpreadsheet, FileType, Presentation } from 'lucide-react';
import type { ChecklistDocument } from '../utils/checklist';
import Image from 'next/image';
import { downloadDocument } from '@/lib/apiClient'; // <-- FIX: Import the correct download function

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ChecklistDocument[];
  startIndex: number;
}

export function DocumentPreviewModal({ isOpen, onClose, documents, startIndex }: DocumentPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  const loadDocumentPreview = useCallback(async (doc: ChecklistDocument) => {
    // FIX: The ID for download is the version ID, which is doc.id
    if (!doc.id || doc.status === 'Missing') {
      setPreviewUrl(null);
      setError('Document not available for preview');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const docId = parseInt(doc.id);
      if (isNaN(docId)) {
        throw new Error('Invalid document ID');
      }

      // FIX: Use the centralized downloadDocument function which handles JWT auth
      const blob = await downloadDocument(docId);
      const url = URL.createObjectURL(blob);
      
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      
      previousUrlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document preview. Please check permissions or network.');
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && documents[currentIndex]) {
      loadDocumentPreview(documents[currentIndex]);
    }
  }, [currentIndex, isOpen, documents, loadDocumentPreview]);

  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        previousUrlRef.current = null;
      }
    };
  }, []);

  const getFileTypeInfo = (mimeType?: string) => {
    if (!mimeType) return { type: 'unknown', icon: File, color: 'text-gray-500', canPreview: false };
    
    if (mimeType === 'application/pdf') {
      return { type: 'PDF', icon: FileText, color: 'text-red-500', canPreview: true };
    }
    if (mimeType.startsWith('image/')) {
      return { type: 'Image', icon: ImageIcon, color: 'text-blue-500', canPreview: true };
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return { type: 'Word', icon: FileText, color: 'text-blue-600', canPreview: false };
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return { type: 'Excel', icon: FileSpreadsheet, color: 'text-green-600', canPreview: false };
    }
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return { type: 'PowerPoint', icon: Presentation, color: 'text-orange-600', canPreview: false };
    }
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      return { type: 'Text', icon: FileType, color: 'text-gray-600', canPreview: true };
    }
    
    return { type: 'Document', icon: File, color: 'text-gray-500', canPreview: false };
  };

  if (!isOpen || documents.length === 0) return null;

  const currentDoc = documents[currentIndex];
  if (!currentDoc) return null;

  const goToNext = () => setCurrentIndex(prev => (prev + 1) % documents.length);
  const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + documents.length) % documents.length);
  const goToIndex = (index: number) => setCurrentIndex(index);

  const fileTypeInfo = getFileTypeInfo(currentDoc.mimeType);
  const isImage = currentDoc.mimeType?.startsWith('image/');
  const isPdf = currentDoc.mimeType === 'application/pdf';
  const isText = currentDoc.mimeType === 'text/plain';

  const getFileExtension = (mimeType?: string) => {
    if (!mimeType) return '';
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
    };
    return extensions[mimeType] || '';
  };

  const handleDownload = async () => {
    // FIX: The ID for download is the version ID, which is doc.id
    if (!currentDoc.id) return;
    
    try {
      const docId = parseInt(currentDoc.id);
      if (isNaN(docId)) {
        throw new Error('Invalid document ID');
      }

      // FIX: Use the centralized downloadDocument function
      const blob = await downloadDocument(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentDoc.name + getFileExtension(currentDoc.mimeType);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document');
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download Document
          </button>
        </div>
      );
    }

    if (!previewUrl && currentDoc.status === 'Missing') {
      return (
        <div className="text-center p-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <p className="text-slate-500">Document not yet uploaded</p>
        </div>
      );
    }

    if (!previewUrl) return null;

    if (isImage) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <Image 
            src={previewUrl} 
            alt={currentDoc.name}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 70vw"
            priority
          />
        </div>
      );
    }

    if (isPdf || isText) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full"
          title={currentDoc.name}
        />
      );
    }

    return (
      <div className="text-center p-8">
        <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <fileTypeInfo.icon size={40} className={fileTypeInfo.color} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {fileTypeInfo.type} Document
        </h3>
        <p className="text-slate-500 mb-6">
          Preview not available for this file type.<br />
          Download the document to view its contents.
        </p>
        <div className="flex justify-center gap-3">
          <button 
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={16} />
            Download to View
          </button>
          {previewUrl && (
            <button 
              onClick={handleOpenInNewTab}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Open in New Tab
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="p-4 rounded-xl border w-full h-full flex flex-col bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <fileTypeInfo.icon className={`h-6 w-6 ${fileTypeInfo.color}`} />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentDoc.name} {currentDoc.version && `(v${currentDoc.version})`}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>Document {currentIndex + 1} of {documents.length}</span>
                  <span>•</span>
                  <span>{currentDoc.ownerName}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${fileTypeInfo.color} bg-gray-100 dark:bg-gray-800`}>
                    {fileTypeInfo.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentDoc.status !== 'Missing' && (
              <>
                <button 
                  onClick={handleDownload}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                {previewUrl && fileTypeInfo.canPreview && (
                  <button 
                    onClick={handleOpenInNewTab}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
            {renderPreviewContent()}
            
            <button 
              onClick={goToPrevious} 
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={documents.length <= 1}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={goToNext} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={documents.length <= 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="w-64 flex-shrink-0 flex flex-col">
            <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Documents</h4>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {documents.map((doc, index) => {
                const docTypeInfo = getFileTypeInfo(doc.mimeType);
                return (
                  <button
                    key={`${doc.id}-${index}`}
                    onClick={() => goToIndex(index)}
                    className={`w-full p-3 text-left rounded-lg flex items-center gap-3 transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500'
                        : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <docTypeInfo.icon className={`h-5 w-5 flex-shrink-0 ${docTypeInfo.color}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{doc.ownerName}</span>
                        <span>•</span>
                        <span>{docTypeInfo.type}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
