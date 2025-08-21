// =================================================================================
// FILE: src/features/party/components/PartyRoleEditor.tsx
// =================================================================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ExternalLink,
  Check
} from 'lucide-react';
import Link from 'next/link';
import type { PartyAssociation } from './PartyProfileView';
import { updatePartyRelationships, removePartyFromCase, getDocumentRequirements } from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';
import type { DocumentRequirements } from '@/types/entities';

interface PartyRoleEditorProps {
  partyId: string;
  partyName: string;
  associations: PartyAssociation[];
  onUpdate: (updatedAssociations: PartyAssociation[]) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface EditingState {
  caseId: string;
  roles: Set<string>;
  ownershipPercentage: number | undefined;
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

// Individual Role Chip Component
const RoleChip = ({ 
  role, 
  isSelected, 
  onToggle, 
  isEditing,
  ownershipPercentage
}: { 
  role: string; 
  isSelected: boolean; 
  onToggle: () => void; 
  isEditing: boolean;
  ownershipPercentage?: number;
}) => {
  const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200";
  
  if (!isEditing) {
    return (
      <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200`}>
        {role}
        {ownershipPercentage !== undefined && (
          <span className="ml-1 text-xs opacity-75">
            ({ownershipPercentage}%)
          </span>
        )}
      </span>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${baseClasses} cursor-pointer border-2 
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
            className="mr-1"
          >
            <Check size={14} />
          </motion.div>
        )}
      </AnimatePresence>
      {role}
    </motion.button>
  );
};

// Enhanced Association Card Component
const AssociationCard = ({
  association,
  isEditing,
  editingState,
  availableRoles,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteConfirm,
  onRoleToggle,
  onOwnershipChange,
  isUpdating
}: {
  association: PartyAssociation;
  isEditing: boolean;
  editingState: EditingState | null;
  availableRoles: string[];
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteConfirm: () => void;
  onRoleToggle: (role: string) => void;
  onOwnershipChange: (value: number | undefined) => void;
  isUpdating: boolean;
}) => {
  const showOwnershipField = useMemo(() => {
    if (!isEditing || !editingState) return false;
    return Array.from(editingState.roles).some(role => OWNERSHIP_ROLES.includes(role));
  }, [isEditing, editingState]);

  // Extract ownership from role display
  const getOwnershipFromRole = (role: string) => {
    const match = role.match(/\((\d+(?:\.\d+)?)%\)/);
    return match ? parseFloat(match[1]) : undefined;
  };

  const getCleanRole = (role: string) => {
    return role.replace(/\s*\(\d+(?:\.\d+)?%\)/, '');
  };

  return (
    <motion.div
      layout
      className={`
        group border rounded-lg transition-all duration-200 overflow-hidden
        ${isEditing 
          ? 'border-blue-300 dark:border-blue-600 shadow-lg bg-blue-50/50 dark:bg-blue-900/10' 
          : 'border-slate-200 dark:border-slate-700 hover:shadow-md bg-white dark:bg-slate-800'
        }
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <Link
              href={`/cases/${association.caseId}`}
              className="group/link"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm group-hover:shadow-md transition-shadow">
                  <Building size={20} />
                </div>
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 flex items-center gap-1 transition-colors">
                    {association.entityName}
                    <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                      {association.entityType}
                    </span>
                    <span>•</span>
                    <span>{association.caseId}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Action Buttons */}
          <WithPermission permission="case:update">
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancelEdit}
                    disabled={isUpdating}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    title="Cancel editing"
                  >
                    <X size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSaveEdit}
                    disabled={isUpdating || (editingState?.roles.size === 0)}
                    className="p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Save changes"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save size={16} />
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartEdit}
                    disabled={isUpdating}
                    className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                    title="Edit roles"
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDeleteConfirm}
                    disabled={isUpdating}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Remove from case"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              )}
            </div>
          </WithPermission>
        </div>

        {/* Roles Section */}
        <div className="space-y-3">
          {isEditing ? (
            <div className="space-y-4">
              {/* Role Selection Grid */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Roles for this Case
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map(role => (
                    <RoleChip
                      key={role}
                      role={role}
                      isSelected={editingState?.roles.has(role) || false}
                      onToggle={() => onRoleToggle(role)}
                      isEditing={true}
                    />
                  ))}
                </div>
                {editingState?.roles.size === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    At least one role must be selected
                  </p>
                )}
              </div>

              {/* Ownership Percentage Field */}
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
                      value={editingState?.ownershipPercentage || ''}
                      onChange={(e) => onOwnershipChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="e.g., 25.5"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {association.roles.map(role => {
                const cleanRole = getCleanRole(role);
                const ownership = getOwnershipFromRole(role);
                return (
                  <RoleChip
                    key={role}
                    role={cleanRole}
                    isSelected={false}
                    onToggle={() => {}}
                    isEditing={false}
                    ownershipPercentage={ownership}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export function PartyRoleEditor({
  partyId,
  partyName,
  associations,
  onUpdate,
  showToast
}: PartyRoleEditorProps) {
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirements | null>(null);

  // Load document requirements for role mapping
  useEffect(() => {
    getDocumentRequirements()
      .then(setDocumentRequirements)
      .catch(error => {
        console.error('Failed to load document requirements:', error);
      });
  }, []);

  const getAvailableRoles = (entityType: string): string[] => {
    if (documentRequirements?.entityRoleMapping) {
      const fromTemplate = documentRequirements.entityRoleMapping[entityType];
      if (fromTemplate && fromTemplate.length > 0) {
        return fromTemplate;
      }
    }
    return DEFAULT_ROLES;
  };

  const handleStartEdit = (association: PartyAssociation) => {
    // Extract existing roles and ownership
    const existingRoles = new Set<string>();
    let ownershipPercentage: number | undefined;

    association.roles.forEach(role => {
      // Check if role has ownership info
      const ownershipMatch = role.match(/\((\d+(?:\.\d+)?)%\)/);
      if (ownershipMatch) {
        ownershipPercentage = parseFloat(ownershipMatch[1]);
        existingRoles.add(role.replace(/\s*\(\d+(?:\.\d+)?%\)/, ''));
      } else {
        existingRoles.add(role);
      }
    });

    setEditingCase(association.caseId);
    setEditingState({
      caseId: association.caseId,
      roles: existingRoles,
      ownershipPercentage
    });
  };

  const handleCancelEdit = () => {
    setEditingCase(null);
    setEditingState(null);
  };

  const handleRoleToggle = (role: string) => {
    if (!editingState) return;

    const newRoles = new Set(editingState.roles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }

    // Clear ownership if no ownership roles are selected
    const hasOwnershipRole = Array.from(newRoles).some(r => OWNERSHIP_ROLES.includes(r));
    
    setEditingState({
      ...editingState,
      roles: newRoles,
      ownershipPercentage: hasOwnershipRole ? editingState.ownershipPercentage : undefined
    });
  };

  const handleOwnershipChange = (value: number | undefined) => {
    if (!editingState) return;
    setEditingState({
      ...editingState,
      ownershipPercentage: value
    });
  };

  const handleSaveEdit = async () => {
    if (!editingState || editingState.roles.size === 0) return;

    setIsUpdating(editingState.caseId);
    try {
      // Prepare relationships array for API
      const relationships = Array.from(editingState.roles).map(role => ({
        type: role,
        ownershipPercentage: OWNERSHIP_ROLES.includes(role) ? editingState.ownershipPercentage : undefined
      }));

      await updatePartyRelationships(editingState.caseId, partyId, relationships);

      // Update local state
      const updatedAssociations = associations.map(assoc => {
        if (assoc.caseId === editingState.caseId) {
          return {
            ...assoc,
            roles: relationships.map(rel => 
              rel.ownershipPercentage 
                ? `${rel.type} (${rel.ownershipPercentage}%)`
                : rel.type
            )
          };
        }
        return assoc;
      });

      onUpdate(updatedAssociations);
      setEditingCase(null);
      setEditingState(null);
      showToast('success', `Updated relationships for ${partyName}`);
    } catch (error) {
      console.error('Failed to update party relationships:', error);
      showToast('error', 'Failed to update relationships. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveFromCase = async (caseId: string, entityName: string) => {
    setIsUpdating(caseId);
    try {
      await removePartyFromCase(caseId, partyId);

      // Update local state
      const updatedAssociations = associations.filter(assoc => assoc.caseId !== caseId);
      onUpdate(updatedAssociations);
      setShowConfirmDelete(null);
      showToast('success', `Removed ${partyName} from ${entityName}`);
    } catch (error) {
      console.error('Failed to remove party from case:', error);
      showToast('error', 'Failed to remove party. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  if (associations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <Building size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Not associated with any cases yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {associations.map((association) => {
          const availableRoles = getAvailableRoles(association.entityType);
          const isThisEditing = editingCase === association.caseId;
          
          return (
            <AssociationCard
              key={association.caseId}
              association={association}
              isEditing={isThisEditing}
              editingState={editingState}
              availableRoles={availableRoles}
              onStartEdit={() => handleStartEdit(association)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDeleteConfirm={() => setShowConfirmDelete(association.caseId)}
              onRoleToggle={handleRoleToggle}
              onOwnershipChange={handleOwnershipChange}
              isUpdating={isUpdating === association.caseId}
            />
          );
        })}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Remove from Case
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to remove {partyName} from this case? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const association = associations.find(a => a.caseId === showConfirmDelete);
                    if (association) {
                      handleRemoveFromCase(association.caseId, association.entityName);
                    }
                  }}
                  disabled={!!isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Removing...
                    </div>
                  ) : (
                    'Remove from Case'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}