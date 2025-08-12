// =================================================================================
// FILE: src/features/case/components/DocumentHistoryModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  RefreshCw,
  Download,
  Eye,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import type { Document, UserInfo } from '@/types/entities';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';
import { downloadDocument } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  versions: Document[]; // Array of flat Document objects
  onMakeCurrent: (documentId: number, document: Document) => void;
  onApprove?: (documentId: number, document: Document) => void;
  onReject?: (documentId: number, document: Document, reason: string) => void;
  onRefresh?: () => Promise<void>;
}

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  documentName: string;
  versionNumber: number;
}

function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  documentName,
  versionNumber
}: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    onConfirm(reason);
    setReason('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Reject Document Version
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {documentName} - Version {versionNumber}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Please provide a detailed reason for rejecting this document..."
              className={`w-full px-3 py-2 rounded-lg border ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              rows={4}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Reject Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentHistoryModal({
  isOpen,
  onClose,
  documentType,
  versions,
  onMakeCurrent,
  onApprove,
  onReject,
  onRefresh
}: DocumentHistoryModalProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [updatingVersionId, setUpdatingVersionId] = useState<number | null>(null);
  const [rejectDialogVersion, setRejectDialogVersion] = useState<{ id: number; version: number } | null>(null);

  const { user: currentUser } = useAuth();

  if (!isOpen || !versions || versions.length === 0) return null;

  // Sort versions by version number (descending - newest first)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  const handleDownload = async (document: Document) => {
    try {
      setDownloadingId(document.id);
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${documentType}_v${document.version}.${document.mimeType === 'application/pdf' ? 'pdf' : 'file'}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (document: Document) => {
    try {
      setProcessingId(document.id);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewVersionId(document.id);
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

  const handleMakeCurrentClick = async (document: Document) => {
    try {
      setUpdatingVersionId(document.id);
      await onMakeCurrent(document.id, document);

      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setUpdatingVersionId(null);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    if (rejectDialogVersion && onReject) {
      const doc = versions.find((v) => v.id === rejectDialogVersion.id);
      if (doc) {
        onReject(rejectDialogVersion.id, doc, reason);
      }
    }
    setRejectDialogVersion(null);
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

  const getUserDisplayName = (userInfo: UserInfo | null): string => {
    if (!userInfo) return 'Unknown';
    return userInfo.name || userInfo.username || 'Unknown';
  };

  const canUserApprove = (document: Document): boolean => {
    // User cannot approve their own uploaded documents
    if (!currentUser || !document.uploadedBy) return true;
    return document.uploadedBy.userId !== currentUser.userId;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        {/* Bigger, taller modal */}
        <div className="p-6 rounded-xl border w-[95vw] max-w-[1400px] bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl h-[92vh] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="text-blue-500" size={22} />
                Version History
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {documentType} • {sortedVersions.length} version
                {sortedVersions.length !== 1 ? 's' : ''}
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

          {/* Let inner area stretch; avoid extra min-heights */}
          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
            {/* Left list takes more space when preview is open */}
            <div
              className={`${
                previewUrl ? 'basis-3/5' : 'basis-full'
              } overflow-y-auto pr-4 space-y-4 min-h-0 shrink-0`}
            >
              <div className="relative">
                <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div>

                {sortedVersions.map((document, index) => {
                  const isCurrent = document.isCurrentForCase === true;
                  const isPreviewing = document.id === previewVersionId;
                  const isProcessing = document.id === processingId;
                  const isUpdating = document.id === updatingVersionId;
                  const shouldShowMakeCurrentButton =
                    !isCurrent && document.status === 'Verified';
                  const isLatestVersion = index === 0;

                  return (
                    <div
                      key={document.id}
                      className={`relative pl-12 pb-4 ${
                        index === sortedVersions.length - 1 ? '' : 'mb-2'
                      }`}
                    >
                      <div
                        className={`absolute left-3 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-800 flex items-center justify-center
                        ${
                          isCurrent
                            ? 'border-blue-500 shadow-lg shadow-blue-500/30'
                            : document.status === 'Verified'
                            ? 'border-green-500'
                            : document.status === 'Rejected'
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isCurrent
                              ? 'bg-blue-500'
                              : document.status === 'Verified'
                              ? 'bg-green-500'
                              : document.status === 'Rejected'
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                          }`}
                        ></div>
                      </div>

                      <div
                        className={`p-5 rounded-xl border transition-all duration-200 ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10'
                            : isPreviewing
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : isUpdating
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:shadow-md'
                        } bg-white dark:bg-slate-800`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                Version {document.version}
                              </h4>
                              {isCurrent && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                                  <Shield size={10} /> Current Published
                                  Document
                                </span>
                              )}
                              {isLatestVersion && !isCurrent && (
                                <span className="px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
                                  Latest
                                </span>
                              )}
                              {isPreviewing && (
                                <span className="px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 rounded-full">
                                  Previewing
                                </span>
                              )}
                              {isUpdating && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300 rounded-full">
                                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-orange-600"></div>
                                  Updating...
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {formatFileSize(document.sizeInBytes)} • ID:{' '}
                              {document.id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(document.status)}
                            <DocStatusBadge status={document.status} />
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-slate-400" />
                            <span>
                              Uploaded:{' '}
                              {new Date(
                                document.uploadedDate
                              ).toLocaleString()}
                            </span>
                          </div>
                          {document.uploadedBy && (
                            <div className="flex items-center gap-2">
                              <User size={12} className="text-slate-400" />
                              <span>
                                Uploaded by: {getUserDisplayName(document.uploadedBy)}{' '}
                                {document.uploadedBy.department &&
                                  `(${document.uploadedBy.department})`}
                              </span>
                            </div>
                          )}
                          {document.verifiedBy && document.verifiedDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle size={12} className="text-green-500" />
                              <span>
                                Verified by: {getUserDisplayName(document.verifiedBy)} on{' '}
                                {new Date(
                                  document.verifiedDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {document.expiryDate && (
                            <div className="flex items-center gap-2">
                              <Calendar
                                size={12}
                                className={
                                  new Date(document.expiryDate) < new Date()
                                    ? 'text-red-500'
                                    : 'text-slate-400'
                                }
                              />
                              <span
                                className={
                                  new Date(document.expiryDate) < new Date()
                                    ? 'text-red-500 font-medium'
                                    : ''
                                }
                              >
                                Expires:{' '}
                                {new Date(
                                  document.expiryDate
                                ).toLocaleDateString()}
                                {new Date(document.expiryDate) < new Date() &&
                                  ' (Expired)'}
                              </span>
                            </div>
                          )}
                          {document.comments && (
                            <div className="flex items-start gap-2 mt-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded">
                              <MessageSquare
                                size={12}
                                className="mt-0.5 text-slate-400"
                              />
                              <span className="italic">
                                {document.comments}
                              </span>
                            </div>
                          )}
                          {document.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-start gap-2">
                                <XCircle
                                  size={14}
                                  className="text-red-500 mt-0.5"
                                />
                                <div>
                                  <p className="font-medium text-red-700 dark:text-red-400">
                                    Rejection Reason
                                  </p>
                                  <p className="text-red-600 dark:text-red-300 mt-1">
                                    {document.rejectionReason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                          <button
                            onClick={() => handlePreview(document)}
                            disabled={isProcessing || isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Preview document"
                          >
                            <Eye size={14} /> Preview
                          </button>
                          <button
                            onClick={() => handleDownload(document)}
                            disabled={downloadingId === document.id || isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download document"
                          >
                            <Download size={14} />
                            {downloadingId === document.id
                              ? 'Downloading...'
                              : 'Download'}
                          </button>

                          <WithPermission permission="document:verify">
                            {document.status === 'Submitted' && (
                              <>
                                <button
                                  onClick={() =>
                                    onApprove && onApprove(document.id, document)
                                  }
                                  disabled={isUpdating || !canUserApprove(document)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    !canUserApprove(document)
                                      ? 'You cannot approve documents you uploaded'
                                      : isLatestVersion
                                      ? 'Approve and publish current version'
                                      : 'Approve this version'
                                  }
                                >
                                  <CheckCircle size={14} />
                                  {isLatestVersion
                                    ? 'Approve & Publish'
                                    : 'Approve'}
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectDialogVersion({
                                      id: document.id,
                                      version: document.version
                                    })
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject this version"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                            {shouldShowMakeCurrentButton && (
                              <button
                                onClick={() => handleMakeCurrentClick(document)}
                                disabled={isUpdating}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-sm ml-auto ${
                                  isUpdating
                                    ? 'bg-orange-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                                title="Make this the current version for the case"
                              >
                                {isUpdating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={14} /> Publish
                                  </>
                                )}
                              </button>
                            )}
                          </WithPermission>
                          {!canUserApprove(document) &&
                            document.status === 'Submitted' && (
                              <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 italic">
                                (Self-verification not allowed)
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview panel gets a fixed minimum width and can grow */}
            {previewUrl && (
              <div className="basis-2/5 min-w-[420px] min-h-0 flex flex-col bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
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
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-inner overflow-hidden min-h-0">
                  {processingId ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                        <p className="text-sm text-slate-500">
                          Loading preview...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="Document Preview"
                      style={{ border: 'none' }}
                      loading="lazy"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

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

      <RejectDialog
        isOpen={!!rejectDialogVersion}
        onClose={() => setRejectDialogVersion(null)}
        onConfirm={handleRejectConfirm}
        documentName={documentType}
        versionNumber={rejectDialogVersion?.version || 0}
      />
    </>
  );
}
