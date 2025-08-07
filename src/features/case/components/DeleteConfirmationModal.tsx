// =================================================================================
// FILE: src/features/case/components/DeleteConfirmationModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  requireReason = false,
  reasonPlaceholder = "Please provide a reason..."
}: DeleteConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Reason is required');
      return;
    }
    onConfirm(reason);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex-1">
              {title}
            </h3>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>
          
          {requireReason && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Reason for deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder={reasonPlaceholder}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 
                  focus:ring-2 focus:ring-red-500 resize-none ${
                  error ? 'border-red-500' : ''
                }`}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 
                dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleConfirm} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 
                hover:bg-red-700 transition-colors"
            >
              Delete Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}