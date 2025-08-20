// =================================================================================
// FILE: src/features/party/components/PartyRelationshipsManager.tsx
// =================================================================================
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import type { PartyAssociation } from './PartyProfileView';
import { updatePartyRelationships, removePartyFromCase } from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';

interface PartyRelationshipsManagerProps {
  partyId: string;
  partyName: string;
  associations: PartyAssociation[];
  onUpdate: (updatedAssociations: PartyAssociation[]) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface EditingState {
  caseId: string;
  roles: string[];
  ownershipPercentage?: number;
}

const AVAILABLE_ROLES = [
  'Director',
  'Shareholder', 
  'Beneficial Owner',
  'Authorised Signatory',
  'Secretary',
  'Partner',
  'Trustee'
];

const OWNERSHIP_ROLES = ['Shareholder', 'Beneficial Owner'];

export function PartyRelationshipsManager({
  partyId,
  partyName,
  associations,
  onUpdate,
  showToast
}: PartyRelationshipsManagerProps) {
  const [editingCase, setEditingCase] = useState<EditingState | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const handleEditCase = (association: PartyAssociation) => {
    // Extract ownership percentage from roles if it exists
    const ownershipRole = association.roles.find(role => 
      OWNERSHIP_ROLES.some(ownerRole => role.includes(ownerRole))
    );
    
    let ownershipPercentage: number | undefined;
    if (ownershipRole) {
      const match = ownershipRole.match(/\((\d+(?:\.\d+)?)%\)/);
      if (match) {
        ownershipPercentage = parseFloat(match[1]);
      }
    }

    setEditingCase({
      caseId: association.caseId,
      roles: association.roles.map(role => role.replace(/\s*\(\d+(?:\.\d+)?%\)/, '')), // Remove percentage from role names
      ownershipPercentage
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;

    setIsUpdating(editingCase.caseId);
    try {
      // Prepare relationships array for API
      const relationships = editingCase.roles.map(role => ({
        type: role,
        ownershipPercentage: OWNERSHIP_ROLES.includes(role) ? editingCase.ownershipPercentage : undefined
      }));

      await updatePartyRelationships(editingCase.caseId, partyId, relationships);

      // Update local state
      const updatedAssociations = associations.map(assoc => {
        if (assoc.caseId === editingCase.caseId) {
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

  const handleRoleToggle = (role: string) => {
    if (!editingCase) return;

    const newRoles = editingCase.roles.includes(role)
      ? editingCase.roles.filter(r => r !== role)
      : [...editingCase.roles, role];

    // Clear ownership percentage if no ownership roles are selected
    const hasOwnershipRole = newRoles.some(r => OWNERSHIP_ROLES.includes(r));
    
    setEditingCase({
      ...editingCase,
      roles: newRoles,
      ownershipPercentage: hasOwnershipRole ? editingCase.ownershipPercentage : undefined
    });
  };

  const showOwnershipField = useMemo(() => {
    return editingCase?.roles.some(role => OWNERSHIP_ROLES.includes(role));
  }, [editingCase?.roles]);

  if (associations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        <Building size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Not associated with any cases yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {associations.map((association, index) => (
        <motion.div
          key={association.caseId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all duration-200"
        >
          {editingCase?.caseId === association.caseId ? (
            // Edit Mode
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">
                    Editing: {association.entityName}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {association.entityType} • {association.caseId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingCase(null)}
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEdit}
                    disabled={isUpdating === association.caseId || editingCase.roles.length === 0}
                    className="p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdating === association.caseId ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save size={16} />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Roles for this Case *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map(role => (
                    <label
                      key={role}
                      className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editingCase.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{role}</span>
                    </label>
                  ))}
                </div>
                {editingCase.roles.length === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    At least one role must be selected
                  </p>
                )}
              </div>

              {/* Ownership Percentage */}
              <AnimatePresence>
                {showOwnershipField && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ownership Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editingCase.ownershipPercentage || ''}
                      onChange={(e) => setEditingCase({
                        ...editingCase,
                        ownershipPercentage: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="e.g., 25.5"
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // View Mode
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Link
                    href={`/cases/${association.caseId}`}
                    className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
                          {association.entityName}
                          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {association.roles.map(role => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <WithPermission permission="case:update">
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditCase(association)}
                      disabled={!!editingCase || !!isUpdating}
                      className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                      title="Edit relationships"
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowConfirmDelete(association.caseId)}
                      disabled={!!editingCase || !!isUpdating}
                      className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Remove from case"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </WithPermission>
              </div>
            </div>
          )}
        </motion.div>
      ))}

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
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md p-6"
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
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
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