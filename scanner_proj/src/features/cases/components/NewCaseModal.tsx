// =================================================================================
// FILE: src/features/cases/components/NewCaseModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CaseCreationData } from '@/types/entities';
//import type { CaseStatus, RiskLevel } from '@/types/enums';
import { useEnumStore } from '@/features/enums/useEnumStore'; // Import the store hook

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CaseCreationData) => void;
}

export function NewCaseModal({ isOpen, onClose, onCreate }: NewCaseModalProps) {
  // Get the dynamic list of entity types from our central store
  const { entityTypes } = useEnumStore(s => s.enums);
  
  const [formData, setFormData] = useState<CaseCreationData>({
    entityName: '',
    entityType: entityTypes[0] || '', // Default to the first type in the list
    riskLevel: 'Low',
    status: 'Prospect',
  });

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entityName) {
      alert('Entity Name is required.');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create New Onboarding Case</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="entityName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Entity Name</label>
            <input
              type="text" id="entityName" name="entityName"
              value={formData.entityName} onChange={handleInputChange} required
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div>
            <label htmlFor="entityType" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Entity Type</label>
            <select
              id="entityType" name="entityType"
              value={formData.entityType} onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              {/* UPDATED: Options are now generated dynamically */}
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="riskLevel" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Risk Level</label>
            <select
              id="riskLevel" name="riskLevel"
              value={formData.riskLevel} onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}