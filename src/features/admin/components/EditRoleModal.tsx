// =================================================================================
// FILE: src/features/admin/components/EditRoleModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (label: string) => void;
  role: { id: number; name: string; label: string } | null;
  isLoading?: boolean;
}

export function EditRoleModal({ isOpen, onClose, onUpdate, role, isLoading }: EditRoleModalProps) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setLabel(role.label);
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label.trim()) {
      setError('Display label is required');
      return;
    }
    
    onUpdate(label);
  };

  const handleClose = () => {
    setLabel('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Role</h3>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            disabled={isLoading}
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Role Name
            </label>
            <input 
              type="text" 
              value={role.name} 
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 border-gray-300 dark:border-slate-600 opacity-50 cursor-not-allowed font-mono"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Display Label <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={label} 
              onChange={e => {
                setLabel(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 transition-colors ${
                error 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
              }`}
              disabled={isLoading}
            />
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Update Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}