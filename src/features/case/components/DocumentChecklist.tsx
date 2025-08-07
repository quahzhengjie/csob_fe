// =================================================================================
// FILE: src/features/case/components/DocumentChecklist.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { ChevronDown, Download, Mail } from 'lucide-react';
import type { ScannerProfile } from '@/types/entities';
import { type ChecklistDocument, type ChecklistSection } from '../utils/checklist';
import { DocumentRequirement } from './DocumentRequirement';
import { downloadDocument } from '@/lib/apiClient';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface DocumentChecklistProps {
  checklist: ChecklistSection[];
  scannerProfiles: ScannerProfile[];
  onLinkDocument: (doc: ChecklistDocument) => void;
  onUploadDocument: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => void;
  onScan: (doc: ChecklistDocument, details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
  onShowHistory: (doc: ChecklistDocument) => void;
  onPreview: (doc: ChecklistDocument) => void;
}

export function DocumentChecklist({ checklist, scannerProfiles, onLinkDocument, onUploadDocument, onScan, onShowHistory, onPreview }: DocumentChecklistProps) {
  const [selectedDocs, setSelectedDocs] = useState<ChecklistDocument[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadSelected = async () => {
    if (selectedDocs.length === 0) return;
    
    setIsDownloading(true);
    try {
      for (const doc of selectedDocs) {
        if (doc.documentId && doc.status !== 'Missing') {
          const blob = await downloadDocument(doc.documentId);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.name}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      setSelectedDocs([]);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download some documents');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    const allAvailableDocs = checklist.flatMap(s => s.documents).filter(d => d.status === 'Verified' || d.status === 'Submitted');
    
    setIsDownloading(true);
    try {
      for (const doc of allAvailableDocs) {
        if (doc.documentId) {
          const blob = await downloadDocument(doc.documentId);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.name}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Add a small delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download some documents');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmail = () => {
    // TODO: Implement email functionality
    alert("Email functionality coming soon!");
  };

  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Document Checklist</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={handleDownloadSelected}
                disabled={selectedDocs.length === 0 || isDownloading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={14} /> 
                {isDownloading ? 'Downloading...' : `Download Selected (${selectedDocs.length})`}
            </button>
            <button 
                onClick={handleDownloadAll} 
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
                <Download size={14} /> 
                {isDownloading ? 'Downloading...' : 'Download All'}
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-800">
                <Mail size={14} /> Email
            </button>
        </div>
      </div>
      <div className="space-y-6">
        {checklist.map((section, sectionIndex) => (
          <div key={`${section.category}-${sectionIndex}`}>
            <button onClick={() => toggleSection(section.category)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50">
              <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">
                {section.category}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({section.documents.length} documents)
                </span>
              </h3>
              <ChevronDown size={20} className={`text-slate-500 transition-transform duration-200 ${expandedSections[section.category] ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections[section.category] && (
              <div className="mt-2 space-y-4 pl-4">
                {/* Group documents by category */}
                {(() => {
                  // Group documents by their category
                  const grouped = section.documents.reduce((acc, doc) => {
                    const category = doc.category || 'CUSTOMER';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(doc);
                    return acc;
                  }, {} as Record<string, ChecklistDocument[]>);
                  
                  // Define the order of categories
                  const categoryOrder = ['CUSTOMER', 'BANK_MANDATORY', 'BANK_NON_MANDATORY'];
                  const sortedCategories = categoryOrder.filter(cat => grouped[cat]?.length > 0);
                  
                  // Add any other categories not in the predefined order
                  Object.keys(grouped).forEach(cat => {
                    if (!categoryOrder.includes(cat) && grouped[cat].length > 0) {
                      sortedCategories.push(cat);
                    }
                  });
                  
                  // If no documents at all, show a message
                  if (section.documents.length === 0) {
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
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}