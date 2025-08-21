// =================================================================================
// FILE: src/features/case/components/DocumentChecklist.tsx
// WITH CONDITIONAL TITLE AND SMART GROUPING
// =================================================================================
'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, Download, Mail, FileSpreadsheet, Package, Search, X } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Case, Party, ScannerProfile } from '@/types/entities';
import { type ChecklistDocument, type ChecklistSection } from '../utils/checklist';
import { DocumentRequirement } from './DocumentRequirement';
import { downloadDocument } from '@/lib/apiClient';
import { 
  ToastContainer, 
  ConfirmationModal, 
  DownloadSummaryModal, 
  useNotifications 
} from './NotificationComponents';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface DocumentChecklistProps {
  caseData: Case;
  parties: Party[];
  checklist: ChecklistSection[];
  scannerProfiles: ScannerProfile[];
  isChecklistTab?: boolean;  // Show "Document Checklist" title only for KYC tab
  showCategoryGrouping?: boolean;  // Show category grouping (Customer/Bank docs) only when relevant
  onLinkDocument: (doc: ChecklistDocument) => void;
  onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
  onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
  onShowHistory: (doc: ChecklistDocument) => void;
  onPreview: (doc: ChecklistDocument) => void;
}

// Helper function to determine file extension from mimeType
const getFileExtension = (mimeType?: string, fileName?: string): string => {
  // First, try to extract extension from fileName if it exists
  if (fileName && fileName.includes('.')) {
    const parts = fileName.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
  
  // Map common MIME types to extensions
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/html': 'html',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
  };
  
  if (mimeType && mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }
  
  // If mimeType contains a slash, try to extract extension from it
  if (mimeType && mimeType.includes('/')) {
    const parts = mimeType.split('/');
    const subtype = parts[1];
    
    // Handle cases like "image/jpeg" -> "jpeg"
    if (subtype && !subtype.includes('vnd.') && !subtype.includes('x-')) {
      return subtype.toLowerCase();
    }
  }
  
  // Default to pdf as it's the most common document type
  return 'pdf';
};

// Helper function to sanitize filename
const sanitizeFilename = (str: string): string => {
  return str
    .replace(/[^a-z0-9\s\-_]/gi, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim()
    .substring(0, 50); // Limit length
};

// Helper function to format date
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

// Download Progress Modal Component
const DownloadProgressModal: React.FC<{ 
  isOpen: boolean;
  current: number; 
  total: number; 
  status: string;
}> = ({ isOpen, current, total, status }) => {
  if (!isOpen) return null;
  
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl border dark:border-slate-700 min-w-[400px]">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="flex-1">
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
              {status}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Processing {current} of {total} documents ({percentage}%)
            </p>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export function DocumentChecklist({ 
  caseData,
  parties,
  checklist, 
  scannerProfiles,
  isChecklistTab = false,
  showCategoryGrouping = false,
  onLinkDocument, 
  onUploadDocument, 
  onScan, 
  onShowHistory, 
  onPreview 
}: DocumentChecklistProps) {
  const [selectedDocs, setSelectedDocs] = useState<ChecklistDocument[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({ 
    isOpen: false, 
    current: 0, 
    total: 0, 
    status: 'Preparing download...' 
  });
  
  // Notification system
  const { notifications, removeNotification, showSuccess, showError, showInfo } = useNotifications();
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details: string[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: [],
    onConfirm: () => {}
  });
  
  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean;
    successCount: number;
    totalCount: number;
    failures: string[];
    isZip: boolean;
  }>({
    isOpen: false,
    successCount: 0,
    totalCount: 0,
    failures: [],
    isZip: false
  });

  const [expandedSections, setExpandedSections] = useState(() => {
    const initialExpansionState: Record<string, boolean> = {};
    checklist.forEach(section => {
      initialExpansionState[section.category] = true;
    });
    return initialExpansionState;
  });

  // Filter checklist based on search query
  const filteredChecklist = useMemo(() => {
    if (!searchQuery.trim()) return checklist;
    
    const query = searchQuery.toLowerCase();
    
    return checklist.map(section => ({
      ...section,
      documents: section.documents.filter(doc => {
        // Search in document name
        if (doc.name.toLowerCase().includes(query)) return true;
        
        // Search in owner name
        if (doc.ownerName?.toLowerCase().includes(query)) return true;
        
        // Search in status
        if (doc.status.toLowerCase().includes(query)) return true;
        
        // Search in comments
        if (doc.comments?.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (doc.description?.toLowerCase().includes(query)) return true;
        
        // Search for party names
        const party = parties?.find(p => p.partyId === doc.ownerId);
        if (party?.name.toLowerCase().includes(query)) return true;
        
        return false;
      })
    })).filter(section => section.documents.length > 0); // Only show sections with matching documents
  }, [checklist, searchQuery, parties]);

  // Count total matching documents
  const matchingDocsCount = useMemo(() => {
    return filteredChecklist.reduce((acc, section) => acc + section.documents.length, 0);
  }, [filteredChecklist]);

  // Auto-expand sections when searching
  useMemo(() => {
    if (searchQuery) {
      // Expand all sections that have matching documents
      setExpandedSections(prev => {
        const newState = { ...prev };
        filteredChecklist.forEach(section => {
          newState[section.category] = true;
        });
        return newState;
      });
    }
  }, [searchQuery, filteredChecklist]);

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

  // Generate standardized filename
  const generateFilename = (
    doc: ChecklistDocument,
    extension: string
  ): string => {
    const components: string[] = [];
    
    // 1. Case ID
    components.push(caseData.caseId);
    
    // 2. Owner name
    if (doc.ownerId === caseData.caseId) {
      components.push(sanitizeFilename(caseData.entity.entityName));
    } else {
      const party = parties.find(p => p.partyId === doc.ownerId);
      components.push(sanitizeFilename(party?.name || 'Unknown_Party'));
    }
    
    // 3. Document type
    components.push(sanitizeFilename(doc.name));
    
    // 4. Version
    if (doc.version) {
      components.push(`v${doc.version}`);
    }
    
    // 5. Status
    if (doc.status && doc.status !== 'Missing') {
      components.push(doc.status);
    }
    
    // 6. Date
    components.push(formatDate(doc.uploadedDate));
    
    return `${components.join('_')}.${extension}`;
  };

  // Download single file WITH DEBUG LOGGING
  const downloadFile = async (
    doc: ChecklistDocument
  ): Promise<{ success: boolean; filename?: string; blob?: Blob }> => {
    try {
      // DEBUG: Log what we're trying to download
      console.log(`🔍 [DEBUG] Attempting to download:`, {
        name: doc.name,
        owner: doc.ownerName,
        ownerId: doc.ownerId,
        documentId: doc.documentId,
        status: doc.status,
        version: doc.version,
        mimeType: doc.mimeType,
        isAdHoc: doc.isAdHoc,
        hasAllVersions: !!doc.allVersions,
        allVersionsCount: doc.allVersions?.length
      });
      
      if (!doc.documentId) {
        console.warn(`⚠️ [DEBUG] Skipping ${doc.name} for ${doc.ownerName}: No documentId`);
        return { success: false };
      }
      
      if (doc.status === 'Missing') {
        console.warn(`⚠️ [DEBUG] Skipping ${doc.name} for ${doc.ownerName}: Status is Missing`);
        return { success: false };
      }
      
      console.log(`✅ [DEBUG] Downloading document ID ${doc.documentId} for ${doc.name}`);
      const blob = await downloadDocument(doc.documentId);
      
      const extension = getFileExtension(doc.mimeType || blob.type, doc.name);
      const filename = generateFilename(doc, extension);
      
      console.log(`✅ [DEBUG] Successfully downloaded ${doc.name} as ${filename}`);
      return { success: true, filename, blob };
    } catch (error) {
      console.error(`❌ [DEBUG] Failed to download ${doc.name} for ${doc.ownerName}:`, error);
      return { success: false };
    }
  };

  // Create and download ZIP file WITH DEBUG LOGGING
  const downloadAsZip = async (
    documents: ChecklistDocument[],
    zipFilename?: string
  ): Promise<{ success: boolean; failures: string[] }> => {
    const zip = new JSZip();
    const failures: string[] = [];
    let successCount = 0;
    
    console.log(`📦 [DEBUG] Starting ZIP download for ${documents.length} documents`);
    
    // Update progress
    setDownloadProgress({
      isOpen: true,
      current: 0,
      total: documents.length,
      status: 'Downloading documents...'
    });
    
    // Organize documents by owner (Entity vs Parties)
    const docsByOwner = documents.reduce((acc, doc) => {
      let folderName: string;
      
      // Check if this is an entity document or party document
      if (doc.ownerId === caseData.caseId || doc.ownerId === caseData.entity.customerId) {
        // Entity documents - use a clear folder name
        folderName = `01_${sanitizeFilename(caseData.entity.entityName)}_Entity_Documents`;
      } else {
        // Party documents - use numbered folders with party names
        const partyIndex = parties.findIndex(p => p.partyId === doc.ownerId);
        const party = parties.find(p => p.partyId === doc.ownerId);
        const partyName = party?.name || doc.ownerName || 'Unknown_Party';
        // Number the folders so they appear in order
        folderName = `${String(partyIndex + 2).padStart(2, '0')}_${sanitizeFilename(partyName)}_Documents`;
      }
      
      if (!acc[folderName]) acc[folderName] = [];
      acc[folderName].push(doc);
      return acc;
    }, {} as Record<string, ChecklistDocument[]>);
    
    console.log(`📁 [DEBUG] Documents organized by owner:`, 
      Object.entries(docsByOwner).map(([owner, docs]) => `${owner}: ${docs.length} docs`)
    );
    
    // Sort folder names to ensure consistent ordering
    const sortedFolders = Object.keys(docsByOwner).sort();
    
    // Process each owner's documents
    let processedCount = 0;
    for (const folderName of sortedFolders) {
      const docs = docsByOwner[folderName];
      
      // Create folder for each owner
      const folder = zip.folder(folderName);
      
      if (!folder) continue;
      
      for (const doc of docs) {
        processedCount++;
        setDownloadProgress(prev => ({
          ...prev,
          current: processedCount,
          status: `Downloading: ${doc.name}...`
        }));
        
        const result = await downloadFile(doc);
        
        if (result.success && result.blob && result.filename) {
          // Add file to the appropriate folder
          folder.file(result.filename, result.blob);
          successCount++;
        } else {
          failures.push(`${doc.name} (${doc.ownerName})`);
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`📊 [DEBUG] ZIP download results:`, {
      total: documents.length,
      success: successCount,
      failed: failures.length,
      failures: failures
    });
    
    if (successCount > 0) {
      setDownloadProgress(prev => ({
        ...prev,
        status: 'Creating ZIP file...'
      }));
      
      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        streamFiles: true
      });
      
      const defaultZipName = `${caseData.caseId}_${sanitizeFilename(caseData.entity.entityName)}_Documents_${formatDate()}.zip`;
      saveAs(zipBlob, zipFilename || defaultZipName);
    }
    
    setDownloadProgress({ isOpen: false, current: 0, total: 0, status: '' });
    
    return { success: successCount > 0, failures };
  };

  const handleDownloadSelected = async () => {
    if (selectedDocs.length === 0) return;
    
    console.log(`🎯 [DEBUG] Download Selected clicked for ${selectedDocs.length} documents`);
    
    setIsDownloading(true);
    
    try {
      // Always use ZIP for multiple files (2 or more)
      if (selectedDocs.length > 1) {
        showInfo('Preparing download...', `Creating ZIP archive with ${selectedDocs.length} documents`);
        
        const result = await downloadAsZip(selectedDocs);
        
        setSummaryModal({
          isOpen: true,
          successCount: selectedDocs.length - result.failures.length,
          totalCount: selectedDocs.length,
          failures: result.failures,
          isZip: true
        });
      } else {
        // Single file - download directly
        const doc = selectedDocs[0];
        const result = await downloadFile(doc);
        
        if (result.success && result.blob && result.filename) {
          saveAs(result.blob, result.filename);
          showSuccess('Download complete', `Successfully downloaded: ${doc.name}`);
        } else {
          showError('Download failed', `Failed to download: ${doc.name}`);
        }
      }
      
      setSelectedDocs([]);
    } catch (error) {
      console.error('Download error:', error);
      showError('Download error', 'An unexpected error occurred while downloading documents');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    console.log('🚀 [DEBUG] Download All button clicked');
    
    // First, let's see ALL documents in the checklist
    console.log('📋 [DEBUG] All checklist sections:', checklist.map(s => ({
      category: s.category,
      documentCount: s.documents.length
    })));
    
    // Log ALL documents before filtering
    const allDocs = checklist.flatMap(s => s.documents);
    console.log(`📄 [DEBUG] Total documents in checklist: ${allDocs.length}`);
    console.log('📄 [DEBUG] All documents details:', allDocs.map(d => ({
      name: d.name,
      owner: d.ownerName,
      ownerId: d.ownerId,
      status: d.status,
      documentId: d.documentId,
      version: d.version,
      category: d.category,
      isEntity: d.ownerId === caseData.caseId,
      isParty: parties && parties.some(p => p.partyId === d.ownerId)
    })));
    
    // Now filter and see what we get
    const allAvailableDocs = checklist
      .flatMap(s => s.documents)
      .filter(d => {
        const included = d.status === 'Verified' || d.status === 'Submitted';
        console.log(`🔍 [DEBUG] Filtering ${d.name} (${d.ownerName}):`, {
          status: d.status,
          included: included,
          documentId: d.documentId,
          hasDocumentId: !!d.documentId
        });
        return included;
      });
    
    console.log(`✅ [DEBUG] Documents after filtering: ${allAvailableDocs.length}`);
    console.log('✅ [DEBUG] Filtered documents:', allAvailableDocs.map(d => ({
      name: d.name,
      owner: d.ownerName,
      status: d.status,
      documentId: d.documentId
    })));
    
    // Check specifically for party documents (only if parties array exists)
    const partyDocs = parties ? allAvailableDocs.filter(d => parties.some(p => p.partyId === d.ownerId)) : [];
    const entityDocs = allAvailableDocs.filter(d => d.ownerId === caseData.caseId);
    
    console.log(`👥 [DEBUG] Party documents: ${partyDocs.length}`, partyDocs.map(d => `${d.name} for ${d.ownerName}`));
    console.log(`🏢 [DEBUG] Entity documents: ${entityDocs.length}`, entityDocs.map(d => d.name));
    
    if (allAvailableDocs.length === 0) {
      showInfo('No documents available', 'There are no documents available for download');
      return;
    }
    
    // Group documents by owner for preview
    const docsByOwner = allAvailableDocs.reduce((acc, doc) => {
      let ownerName: string;
      
      if (doc.ownerId === caseData.caseId || doc.ownerId === caseData.entity.customerId) {
        ownerName = caseData.entity.entityName;
      } else if (parties) {
        const party = parties.find(p => p.partyId === doc.ownerId);
        ownerName = party?.name || doc.ownerName || 'Unknown Party';
      } else {
        ownerName = doc.ownerName || 'Unknown Party';
      }
      
      if (!acc[ownerName]) acc[ownerName] = [];
      acc[ownerName].push(doc);
      return acc;
    }, {} as Record<string, ChecklistDocument[]>);
    
    const ownerBreakdown = Object.entries(docsByOwner)
      .map(([owner, docs]) => `${owner}: ${docs.length} documents`);
    
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: 'Download All Documents',
      message: `Download ${allAvailableDocs.length} documents as a ZIP archive organized by owner?`,
      details: ownerBreakdown,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsDownloading(true);
        
        try {
          showInfo('Download started', 'Preparing your documents for download...');
          const result = await downloadAsZip(allAvailableDocs);
          
          setSummaryModal({
            isOpen: true,
            successCount: allAvailableDocs.length - result.failures.length,
            totalCount: allAvailableDocs.length,
            failures: result.failures,
            isZip: true
          });
        } catch (error) {
          console.error('❌ [DEBUG] Download error:', error);
          showError(
            'Download Error',
            error instanceof Error ? error.message : 'Unknown error occurred'
          );
        } finally {
          setIsDownloading(false);
        }
      }
    });
  };

  const handleEmail = () => {
    showInfo('Coming Soon', 'Email functionality will be available in the next update');
  };

  // Export document list as CSV
  const exportDocumentsList = () => {
    try {
      const allDocs = checklist.flatMap(s => s.documents);
      
      if (allDocs.length === 0) {
        showInfo('No documents to export', 'There are no documents in the checklist to export');
        return;
      }
      
      // Create CSV with BOM for Excel compatibility
      const BOM = '\uFEFF';
      const headers = ['Case ID', 'Entity Name', 'Owner', 'Document Type', 'Status', 'Version', 'Category', 'Uploaded Date', 'Expiry Date', 'Comments'];
      
      const rows = allDocs.map(doc => {
        const owner = doc.ownerId === caseData.caseId 
          ? caseData.entity.entityName 
          : parties?.find(p => p.partyId === doc.ownerId)?.name || doc.ownerName || 'Unknown';
        
        return [
          caseData.caseId,
          caseData.entity.entityName,
          owner,
          doc.name,
          doc.status,
          doc.version || 'N/A',
          doc.category || 'N/A',
          doc.uploadedDate ? formatDate(doc.uploadedDate) : 'N/A',
          doc.expiryDate || 'N/A',
          doc.comments || ''
        ].map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
      });
      
      const csv = BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const filename = `${caseData.caseId}_${sanitizeFilename(caseData.entity.entityName)}_Document_List_${formatDate()}.csv`;
      saveAs(blob, filename);
      
      showSuccess('Export successful', `Document list exported as ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export failed', 'Failed to export document list. Please try again.');
    }
  };

  // Render documents section - either grouped by category or flat list
  const renderDocuments = (documents: ChecklistDocument[]) => {
    if (!showCategoryGrouping) {
      // Simple flat list for ad-hoc and credit documents
      return (
        <div className="space-y-2">
          {documents.map((doc, docIndex) => (
            <div key={`${doc.ownerId}-${doc.name}-${docIndex}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <DocumentRequirement
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
            </div>
          ))}
        </div>
      );
    }

    // Grouped by category for KYC checklist
    const grouped = documents.reduce((acc, doc) => {
      const category = doc.category || 'CUSTOMER';
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, ChecklistDocument[]>);
    
    const categoryOrder = ['CUSTOMER', 'BANK_MANDATORY', 'BANK_NON_MANDATORY'];
    const sortedCategories = categoryOrder.filter(cat => grouped[cat]?.length > 0);
    
    Object.keys(grouped).forEach(cat => {
      if (!categoryOrder.includes(cat) && grouped[cat].length > 0) {
        sortedCategories.push(cat);
      }
    });
    
    if (documents.length === 0) {
      return (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          No documents configured for this section
        </div>
      );
    }
    
    return sortedCategories.map((category, categoryIndex) => {
      const docs = grouped[category];
      const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
        CUSTOMER: { 
          label: 'Mandatory from Customer', 
          color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: '📄'
        },
        BANK_MANDATORY: { 
          label: 'Mandatory Bank Documents', 
          color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
          icon: '🏦'
        },
        BANK_NON_MANDATORY: { 
          label: 'Non-Mandatory Documents', 
          color: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
          icon: '📋'
        }
      };
      
      const config = categoryConfig[category] || {
        label: category,
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        icon: '📄'
      };
      
      return (
        <div key={category} className={`rounded-lg border p-4 ${config.color} ${categoryIndex > 0 ? 'mt-4' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {config.label}
              </h4>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
              {docs.length} document{docs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {docs.map((doc, docIndex) => (
              <div key={`${doc.ownerId}-${doc.name}-${docIndex}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <DocumentRequirement
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
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
      
      <DownloadProgressModal {...downloadProgress} />
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        details={confirmModal.details}
        confirmText="Download"
        cancelText="Cancel"
        type="info"
        icon={<Package className="w-6 h-6" />}
      />
      
      <DownloadSummaryModal
        isOpen={summaryModal.isOpen}
        onClose={() => setSummaryModal(prev => ({ ...prev, isOpen: false }))}
        successCount={summaryModal.successCount}
        totalCount={summaryModal.totalCount}
        failures={summaryModal.failures}
        isZip={summaryModal.isZip}
      />
      
      <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
        {/* Header with title and action buttons */}
        <div className="flex justify-between items-center mb-4">
          {isChecklistTab && (
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Document Checklist</h2>
          )}
          <div className={`flex items-center gap-2 ${!isChecklistTab ? 'w-full justify-end' : ''}`}>
            <button
              onClick={exportDocumentsList}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
              title="Export document list as CSV"
            >
              <FileSpreadsheet size={14} /> Export List
            </button>
            <button
              onClick={handleDownloadSelected}
              disabled={selectedDocs.length === 0 || isDownloading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              <Download size={14} /> 
              {isDownloading ? 'Processing...' : `Download Selected (${selectedDocs.length})`}
            </button>
            <button 
              onClick={handleDownloadAll} 
              disabled={isDownloading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={14} /> 
              {isDownloading ? 'Processing...' : 'Download All'}
            </button>
            <button 
              onClick={handleEmail} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-800"
            >
              <Mail size={14} /> Email
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, owner, status, or comments..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <>
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={18} />
                </button>
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded">
                  {matchingDocsCount} found
                </div>
              </>
            )}
          </div>
          {searchQuery && matchingDocsCount === 0 && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              No documents match your search. Try different keywords.
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {filteredChecklist.map((section, sectionIndex) => (
            <div key={`${section.category}-${sectionIndex}`}>
              <button 
                onClick={() => toggleSection(section.category)} 
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50"
              >
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">
                  {section.category}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({section.documents.length} documents)
                  </span>
                </h3>
                <ChevronDown 
                  size={20} 
                  className={`text-slate-500 transition-transform duration-200 ${expandedSections[section.category] ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {expandedSections[section.category] && (
                <div className="mt-2 space-y-4 pl-4">
                  {renderDocuments(section.documents)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}