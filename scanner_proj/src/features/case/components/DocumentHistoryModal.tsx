// =================================================================================
// FILE: src/features/case/components/DocumentHistoryModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X, History, RefreshCw, Download, Eye, User, Calendar, MessageSquare, CheckCircle, XCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import type { Document, DocumentVersion } from '@/types/entities';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';
import { downloadDocument } from '@/lib/apiClient';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  currentVersionId?: string;
  onMakeCurrent: (documentId: string, version: DocumentVersion) => void;
  onApprove?: (documentId: string, versionId: string) => void;
  onReject?: (documentId: string, versionId: string, reason: string) => void;
}

export function DocumentHistoryModal({ 
  isOpen, 
  onClose, 
  document, 
  onMakeCurrent,
  onApprove, 
  onReject 
}: DocumentHistoryModalProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen || !document) return null;
  
  const reversedVersions = [...document.versions].reverse();

  const handleDownload = async (version: DocumentVersion) => {
    try {
      setDownloadingId(version.id);
      const docId = parseInt(version.id);
      if (!isNaN(docId)) {
        const blob = await downloadDocument(docId);
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.name}_v${version.version}.${version.mimeType === 'application/pdf' ? 'pdf' : 'file'}`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (version: DocumentVersion) => {
    try {
      setProcessingId(version.id);
      // Clean up previous preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const docId = parseInt(version.id);
      if (!isNaN(docId)) {
        const blob = await downloadDocument(docId);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewVersionId(version.id);
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to preview document');
    } finally {
      setProcessingId(null);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewVersionId(null);
  };

  const handleClose = () => {
    handleClosePreview();
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Rejected':
        return <XCircle size={16} className="text-red-500" />;
      case 'Submitted':
        return <Clock size={16} className="text-blue-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-6 rounded-xl border w-full max-w-5xl bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="text-blue-500" size={22} /> 
              Version History
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {document.name} • {reversedVersions.length} versions
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 flex gap-6 overflow-hidden min-h-[400px]">
          {/* Version Timeline */}
          <div className={`${previewUrl ? 'w-1/2' : 'w-full'} overflow-y-auto pr-4 space-y-4`}>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div>
              
              {reversedVersions.map((version, index) => {
                const isCurrent = version.isCurrentForCase === true;
                const isPreviewing = version.id === previewVersionId;
                const isProcessing = version.id === processingId;
                const shouldShowMakeCurrentButton = !isCurrent && version.status === 'Verified';
                
                return (
                  <div 
                    key={version.id} 
                    className={`relative pl-12 pb-4 ${index === reversedVersions.length - 1 ? '' : 'mb-2'}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-3 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-800 flex items-center justify-center
                      ${isCurrent 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/30' 
                        : version.status === 'Verified'
                        ? 'border-green-500'
                        : version.status === 'Rejected'
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-slate-600'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-blue-500' : 
                        version.status === 'Verified' ? 'bg-green-500' :
                        version.status === 'Rejected' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`}></div>
                    </div>
                    
                    {/* Version Card */}
                    <div 
                      className={`p-5 rounded-xl border transition-all duration-200 ${
                        isCurrent ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10" : 
                        isPreviewing ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" :
                        "border-gray-200 dark:border-slate-700 hover:shadow-md"
                      } bg-white dark:bg-slate-800`}
                    >
                      {/* Version Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                              Version {version.version}
                            </h4>
                            {isCurrent && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                                <Shield size={10} /> Current Version
                              </span>
                            )}
                            {isPreviewing && (
                              <span className="px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 rounded-full">
                                Previewing
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {formatFileSize(version.fileSize)} • ID: {version.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(version.status)}
                          <DocStatusBadge status={version.status} />
                        </div>
                      </div>
                      
                      {/* Version Details */}
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Uploaded: {new Date(version.uploadedDate).toLocaleString()}</span>
                        </div>
                        
                        {version.uploadedBy && (
                          <div className="flex items-center gap-2">
                            <User size={12} className="text-slate-400" />
                            <span>Uploaded by: {version.uploadedBy}</span>
                          </div>
                        )}
                        
                        {version.verifiedBy && version.verifiedDate && (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-green-500" />
                            <span>Verified by: {version.verifiedBy} on {new Date(version.verifiedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {version.expiryDate && (
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className={new Date(version.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-400'} />
                            <span className={new Date(version.expiryDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                              Expires: {new Date(version.expiryDate).toLocaleDateString()}
                              {new Date(version.expiryDate) < new Date() && ' (Expired)'}
                            </span>
                          </div>
                        )}
                        
                        {version.comments && (
                          <div className="flex items-start gap-2 mt-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                            <MessageSquare size={12} className="mt-0.5 text-slate-400" />
                            <span className="italic">{version.comments}</span>
                          </div>
                        )}
                        
                        {version.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-2">
                              <XCircle size={14} className="text-red-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-700 dark:text-red-400">Rejection Reason</p>
                                <p className="text-red-600 dark:text-red-300 mt-1">{version.rejectionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <button
                          onClick={() => handlePreview(version)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors disabled:opacity-50"
                          title="Preview document"
                        >
                          <Eye size={14} /> Preview
                        </button>
                        
                        <button
                          onClick={() => handleDownload(version)}
                          disabled={downloadingId === version.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                          title="Download document"
                        >
                          <Download size={14} />
                          {downloadingId === version.id ? 'Downloading...' : 'Download'}
                        </button>
                        
                        <WithPermission permission="case:update">
                          {/* Approval/Rejection buttons for Submitted documents */}
                          {version.status === 'Submitted' && (
                            <>
                              <button 
                                onClick={() => onApprove && onApprove(document.documentId, version.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm"
                                title="Approve this version"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = prompt('Please provide a reason for rejection:');
                                  if (reason && onReject) {
                                    onReject(document.documentId, version.id, reason);
                                  }
                                }} 
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                                title="Reject this version"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          
                          {/* Make Current button for Verified documents */}
                          {shouldShowMakeCurrentButton && (
                            <button 
                              onClick={() => onMakeCurrent(document.documentId, version)} 
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm ml-auto"
                              title="Make this the current version for the case"
                            >
                              <RefreshCw size={14} /> Make Current
                            </button>
                          )}
                        </WithPermission>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Preview Panel */}
          {previewUrl && (
            <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Eye size={16} className="text-purple-500" />
                  Document Preview
                </h4>
                <button
                  onClick={handleClosePreview}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-inner overflow-hidden">
                {processingId ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                      <p className="text-sm text-slate-500">Loading preview...</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title="Document Preview"
                    style={{ border: 'none' }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button 
            onClick={handleClose} 
            className="px-6 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}