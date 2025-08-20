// =================================================================================
// FILE: src/features/party/components/AddToCaseModal.tsx
// =================================================================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Building, CheckCircle, Check } from 'lucide-react';
import type { Case } from '@/types/entities';
import { getCases, addRelatedParty, getDocumentRequirements } from '@/lib/apiClient';
import type { DocumentRequirements } from '@/types/entities';

interface AddToCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId: string;
  partyName: string;
  existingCaseIds: string[];
  onSuccess: (caseId: string, entityName: string, roles: string[]) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SelectedCase {
  caseId: string;
  entityName: string;
  entityType: string;
  status: string;
  riskLevel: string;
}

const DEFAULT_ROLES = [
  'Director',
  'Shareholder', 
  'Beneficial Owner',
  'Authorised Signatory',
  'Secretary',
  'Partner',
  'Trustee'
];

const OWNERSHIP_ROLES = ['Shareholder', 'Beneficial Owner'];

// Role Chip Component for Modal
const RoleChip = ({ 
  role, 
  isSelected, 
  onToggle 
}: { 
  role: string; 
  isSelected: boolean; 
  onToggle: () => void; 
}) => {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border-2
        ${isSelected 
          ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }
      `}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mr-2"
          >
            <Check size={14} />
          </motion.div>
        )}
      </AnimatePresence>
      {role}
    </motion.button>
  );
};

// Case Card Component
const CaseCard = ({ 
  caseItem, 
  isSelected, 
  onSelect 
}: { 
  caseItem: Case; 
  isSelected: boolean; 
  onSelect: () => void; 
}) => (
  <motion.div
    whileHover={{ x: 5 }}
    onClick={onSelect}
    className={`
      p-4 cursor-pointer border-b last:border-b-0 dark:border-slate-700 transition-all duration-200 rounded-lg mb-2
      ${isSelected
        ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500 shadow-md'
        : 'hover:bg-gray-100 dark:hover:bg-slate-700 border-2 border-transparent'
      }
    `}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
        <Building size={24} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-slate-800 dark:text-slate-200">
            {caseItem.entity.entityName}
          </h4>
          {isSelected && (
            <CheckCircle size={18} className="text-green-600" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md font-medium">
            {caseItem.entity.entityType}
          </span>
          <span>•</span>
          <span className="font-mono">{caseItem.caseId}</span>
          <span>•</span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            caseItem.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            caseItem.status === 'KYC Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          }`}>
            {caseItem.status}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
);

export function AddToCaseModal({
  isOpen,
  onClose,
  partyId,
  partyName,
  existingCaseIds,
  onSuccess,
  showToast
}: AddToCaseModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<SelectedCase | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [ownershipPercentage, setOwnershipPercentage] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirements | null>(null);

  // Get available roles for the selected case entity type
  const availableRoles = useMemo(() => {
    if (!selectedCase || !documentRequirements?.entityRoleMapping) {
      return DEFAULT_ROLES;
    }
    
    const entityRoles = documentRequirements.entityRoleMapping[selectedCase.entityType];
    return entityRoles && entityRoles.length > 0 ? entityRoles : DEFAULT_ROLES;
  }, [selectedCase, documentRequirements]);

  // Load cases and document requirements on mount
  useEffect(() => {
    if (isOpen) {
      loadCases();
      loadDocumentRequirements();
    }
  }, [isOpen]);

  // Reset roles when case selection changes
  useEffect(() => {
    setSelectedRoles(new Set());
    setOwnershipPercentage(undefined);
  }, [selectedCase]);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const cases = await getCases();
      setAllCases(cases);
    } catch (error) {
      console.error('Failed to load cases:', error);
      showToast('error', 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentRequirements = async () => {
    try {
      const requirements = await getDocumentRequirements();
      setDocumentRequirements(requirements);
    } catch (error) {
      console.error('Failed to load document requirements:', error);
    }
  };

  const filteredCases = useMemo(() => {
    return allCases.filter(caseItem => {
      // Exclude cases where party is already associated
      if (existingCaseIds.includes(caseItem.caseId)) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          caseItem.entity.entityName.toLowerCase().includes(searchLower) ||
          caseItem.caseId.toLowerCase().includes(searchLower) ||
          caseItem.entity.entityType.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [allCases, existingCaseIds, searchTerm]);

  const showOwnershipField = useMemo(() => {
    return Array.from(selectedRoles).some(role => OWNERSHIP_ROLES.includes(role));
  }, [selectedRoles]);

  const handleRoleToggle = (role: string) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    
    setSelectedRoles(newRoles);
    
    // Clear ownership if no ownership roles selected
    const hasOwnershipRole = Array.from(newRoles).some(r => OWNERSHIP_ROLES.includes(r));
    if (!hasOwnershipRole) {
      setOwnershipPercentage(undefined);
    }
  };

  const handleCaseSelect = (caseItem: Case) => {
    setSelectedCase({
      caseId: caseItem.caseId,
      entityName: caseItem.entity.entityName,
      entityType: caseItem.entity.entityType,
      status: caseItem.status,
      riskLevel: caseItem.riskLevel
    });
  };

  const handleSubmit = async () => {
    if (!selectedCase || selectedRoles.size === 0) {
      showToast('error', 'Please select a case and at least one role');
      return;
    }

    setIsSubmitting(true);
    try {
      const roleArray = Array.from(selectedRoles);
      
      // Add party to case for each selected role
      for (const role of roleArray) {
        await addRelatedParty(selectedCase.caseId, {
          partyId,
          name: partyName,
          relationshipType: role,
          ownershipPercentage: OWNERSHIP_ROLES.includes(role) ? ownershipPercentage : undefined
        });
      }

      const rolesWithOwnership = roleArray.map(role => 
        OWNERSHIP_ROLES.includes(role) && ownershipPercentage 
          ? `${role} (${ownershipPercentage}%)`
          : role
      );

      onSuccess(selectedCase.caseId, selectedCase.entityName, rolesWithOwnership);
      handleClose();
      showToast('success', `Added ${partyName} to ${selectedCase.entityName}`);
    } catch (error) {
      console.error('Failed to add party to case:', error);
      showToast('error', 'Failed to add party to case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedCase(null);
    setSelectedRoles(new Set());
    setOwnershipPercentage(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="p-6 rounded-xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-700 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Add {partyName} to Case
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* Case Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Search for Case
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by entity name, case ID, or entity type..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Case Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Select Case
              {selectedCase && (
                <span className="ml-2 text-green-600 font-normal">
                  ✓ {selectedCase.entityName}
                </span>
              )}
            </label>
            <div className="max-h-80 overflow-y-auto border rounded-lg p-2 bg-gray-50 dark:bg-slate-900/50 dark:border-slate-600">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500">Loading cases...</p>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  {searchTerm ? 'No cases found matching your search.' : 'No available cases to join.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.caseId}
                      caseItem={caseItem}
                      isSelected={selectedCase?.caseId === caseItem.caseId}
                      onSelect={() => handleCaseSelect(caseItem)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role Selection with Chips */}
          <AnimatePresence>
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Select Roles for {selectedCase.entityName}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableRoles.map(role => (
                      <RoleChip
                        key={role}
                        role={role}
                        isSelected={selectedRoles.has(role)}
                        onToggle={() => handleRoleToggle(role)}
                      />
                    ))}
                  </div>
                  {selectedRoles.size === 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      At least one role must be selected
                    </p>
                  )}
                  
                  {/* Selected roles summary */}
                  {selectedRoles.size > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Selected roles:</strong> {Array.from(selectedRoles).join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ownership Percentage */}
                <AnimatePresence>
                  {showOwnershipField && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ownership Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={ownershipPercentage || ''}
                        onChange={(e) => setOwnershipPercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="e.g., 25.5"
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        This will apply to all ownership roles ({OWNERSHIP_ROLES.filter(role => selectedRoles.has(role)).join(', ')})
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t dark:border-slate-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedCase || selectedRoles.size === 0 || isSubmitting}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </div>
            ) : (
              'Add to Case'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}