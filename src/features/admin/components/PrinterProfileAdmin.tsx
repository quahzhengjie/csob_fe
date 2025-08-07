// =================================================================================
// FILE: src/features/admin/components/PrinterProfileAdmin.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { 
  getScannerProfiles, 
  createScannerProfile, 
  deleteScannerProfile 
} from '@/lib/apiClient';
import type { ScannerProfile } from '@/types/entities';

interface PrinterProfileAdminProps {
    initialProfiles?: ScannerProfile[];
}

export default function PrinterProfileAdmin({ initialProfiles = [] }: PrinterProfileAdminProps) {
  const [profiles, setProfiles] = useState<ScannerProfile[]>(initialProfiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Omit<ScannerProfile, 'id'>>({
    name: '',
    resolution: '300dpi',
    colorMode: 'Color',
    source: 'ADF',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Resolution options
  const resolutionOptions = ['100dpi', '150dpi', '200dpi', '300dpi', '600dpi', '1200dpi'];
  const colorModeOptions = ['Color', 'Grayscale', 'Black & White'];
  const sourceOptions = ['ADF', 'Flatbed', 'Auto'];

  // Update profiles when initialProfiles changes
  useEffect(() => {
    setProfiles(initialProfiles);
  }, [initialProfiles]);

  const refreshProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScannerProfiles();
      setProfiles(data);
    } catch (err) {
      setError('Failed to refresh printer profiles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Profile name is required';
    } else if (profiles.some(p => p.name.toLowerCase() === formData.name.trim().toLowerCase())) {
      errors.name = 'A profile with this name already exists';
    }
    
    if (!formData.resolution) {
      errors.resolution = 'Resolution is required';
    }
    
    if (!formData.colorMode) {
      errors.colorMode = 'Color mode is required';
    }
    
    if (!formData.source) {
      errors.source = 'Source is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // If setting as default, unset other defaults
      const profileToCreate = {
        ...formData,
        name: formData.name.trim(),
        isDefault: formData.isDefault || profiles.length === 0 // First profile is default
      };
      
      await createScannerProfile(profileToCreate);
      
      // Reset form
      setFormData({
        name: '',
        resolution: '300dpi',
        colorMode: 'Color',
        source: 'ADF',
        isDefault: false
      });
      setShowAddForm(false);
      setFormErrors({});
      
      // Refresh profiles
      await refreshProfiles();
    } catch (err) {
      setError('Failed to create printer profile');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteScannerProfile(id);
      setDeleteConfirm(null);
      await refreshProfiles();
    } catch (err) {
      setError('Failed to delete printer profile');
      console.error(err);
    }
  };

  const handleSetDefault = async (profile: ScannerProfile) => {
    // This would require an update endpoint - for now just update locally
    try {
      setError(null);
      // Update all profiles to not be default
      const updatedProfiles = profiles.map(p => ({
        ...p,
        isDefault: p.id === profile.id
      }));
      setProfiles(updatedProfiles);
      // TODO: Call update API endpoint when available
      // await updateScannerProfile(profile.id, { ...profile, isDefault: true });
    } catch (err) {
      setError('Failed to update default profile');
      console.error(err);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setFormErrors({});
    setFormData({
      name: '',
      resolution: '300dpi',
      colorMode: 'Color',
      source: 'ADF',
      isDefault: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Printer Profile Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure scanner and printer profiles for document processing
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Add New Profile Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            Add New Profile
          </button>
        )}

        {/* Add Profile Form */}
        {showAddForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Printer Profile
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 
                             text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 
                             ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    placeholder="e.g., Office Scanner, High-Quality Color"
                    disabled={submitting}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution *
                  </label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 
                             text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 
                             ${formErrors.resolution ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    disabled={submitting}
                  >
                    {resolutionOptions.map(res => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                  {formErrors.resolution && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.resolution}</p>
                  )}
                </div>

                {/* Color Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Mode *
                  </label>
                  <select
                    value={formData.colorMode}
                    onChange={(e) => setFormData({ ...formData, colorMode: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 
                             text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 
                             ${formErrors.colorMode ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    disabled={submitting}
                  >
                    {colorModeOptions.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  {formErrors.colorMode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.colorMode}</p>
                  )}
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 
                             text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 
                             ${formErrors.source ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    disabled={submitting}
                  >
                    {sourceOptions.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  {formErrors.source && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.source}</p>
                  )}
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={submitting || profiles.length === 0}
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set as default profile
                  {profiles.length === 0 && (
                    <span className="text-xs text-gray-500 ml-2">(First profile will be default)</span>
                  )}
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 
                           rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
                           flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profiles List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Existing Profiles ({profiles.length})
              </h2>
              {loading && (
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              )}
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className="p-12 text-center">
              <Printer className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No printer profiles configured</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Add your first profile to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Profile Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resolution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Color Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Printer className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {profile.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.resolution}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.colorMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.isDefault ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(profile)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Set as default
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {deleteConfirm === profile.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Delete?</span>
                            <button
                              onClick={() => profile.id && handleDelete(profile.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(profile.id || null)}
                            disabled={profile.isDefault}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={profile.isDefault ? "Cannot delete default profile" : "Delete profile"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Profile Configuration Guide
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• <strong>Resolution:</strong> Higher DPI provides better quality but larger file sizes</li>
            <li>• <strong>Color Mode:</strong> Use Grayscale or B&W for documents to reduce file size</li>
            <li>• <strong>Source:</strong> ADF for multi-page documents, Flatbed for single pages or photos</li>
            <li>• <strong>Default Profile:</strong> Will be pre-selected when users scan documents</li>
          </ul>
        </div>
      </div>
    </div>
  );
}