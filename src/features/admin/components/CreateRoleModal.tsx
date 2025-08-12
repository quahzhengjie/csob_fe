// =================================================================================
// FILE: src/features/admin/components/CreateRoleModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X, Loader2, Shield } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roleData: { name: string; label: string; permissions: Record<string, boolean> }) => void;
  existingRoles: string[];
  allPermissions: string[];
  isLoading?: boolean;
}

export function CreateRoleModal({ 
  isOpen, 
  onClose, 
  onCreate, 
  existingRoles, 
  allPermissions,
  isLoading 
}: CreateRoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    permissions: {} as Record<string, boolean>
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!formData.name.startsWith('ROLE_')) {
      newErrors.name = 'Role name must start with ROLE_';
    } else if (!/^ROLE_[A-Z_]+$/.test(formData.name)) {
      newErrors.name = 'Role name must be uppercase with underscores only';
    } else if (existingRoles.includes(formData.name)) {
      newErrors.name = 'This role already exists';
    }
    
    if (!formData.label.trim()) {
      newErrors.label = 'Display label is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onCreate(formData);
  };

  const handleClose = () => {
    setFormData({ name: '', label: '', permissions: {} });
    setErrors({});
    onClose();
  };

  const formatPermissionLabel = (permission: string): string => {
    return permission
      .replace(/admin:/, 'Admin: ')
      .replace(/case:/, 'Case: ')
      .replace(/document:/, 'Document: ')
      .split(/[:\-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-8 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield size={20} />
            Create New Role
          </h3>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            disabled={isLoading}
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 transition-colors font-mono ${
                  errors.name 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                }`}
                placeholder="ROLE_CUSTOM"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Must start with ROLE_ and use uppercase</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Display Label <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.label} 
                onChange={e => setFormData({...formData, label: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 transition-colors ${
                  errors.label 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                }`}
                placeholder="Custom Role"
                disabled={isLoading}
              />
              {errors.label && (
                <p className="mt-1 text-xs text-red-500">{errors.label}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
              Initial Permissions (Optional)
            </label>
            <div className="border rounded-lg dark:border-slate-600 p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {allPermissions.map(permission => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions[permission] || false}
                      onChange={e => setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          [permission]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{formatPermissionLabel(permission)}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              You can configure permissions later in the Permissions tab
            </p>
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
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}