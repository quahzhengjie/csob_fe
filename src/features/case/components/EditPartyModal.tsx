// =================================================================================
// FILE: src/features/case/components/EditPartyModal.tsx
// =================================================================================
'use client';
import React, { useReducer, useMemo, useEffect, useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type {DocumentRequirements } from '@/types/entities';
import { getDocumentRequirements } from '@/lib/apiClient';

// Types for the modal
interface EditPartyData {
  partyId: string;
  name: string;
  relationships: { type: string; ownershipPercentage?: number }[];
}

interface State {
  roles: { type: string; ownershipPercentage?: number }[];
  ownership: string;
  validationError: string | null;
}

type Action =
  | { type: 'ADD_ROLE'; payload: string }
  | { type: 'REMOVE_ROLE'; payload: string }
  | { type: 'UPDATE_OWNERSHIP'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM'; payload: { roles: { type: string; ownershipPercentage?: number }[] } };

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ROLE':
      if (action.payload && !state.roles.some(r => r.type === action.payload)) {
        return { ...state, roles: [...state.roles, { type: action.payload }] };
      }
      return state;
    case 'REMOVE_ROLE':
      const newRoles = state.roles.filter(r => r.type !== action.payload);
      const wasOwnershipRoleRemoved = !newRoles.some(r =>
        ['Shareholder', 'Beneficial Owner'].includes(r.type),
      );
      return {
        ...state,
        roles: newRoles,
        ownership: wasOwnershipRoleRemoved ? '' : state.ownership,
      };
    case 'UPDATE_OWNERSHIP':
      return { ...state, ownership: action.payload };
    case 'SET_ERROR':
      return { ...state, validationError: action.payload };
    case 'RESET_FORM':
      return {
        roles: action.payload.roles,
        ownership: action.payload.roles.find(r => ['Shareholder', 'Beneficial Owner'].includes(r.type))?.ownershipPercentage?.toString() || '',
        validationError: null,
      };
    default:
      return state;
  }
}

const RoleManager = ({ 
  state, 
  dispatch, 
  entityType
}: { 
  state: State; 
  dispatch: React.Dispatch<Action>; 
  entityType: string;
  existingPartyIds: string[];
  currentPartyId: string;
}) => {
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirements | null>(null);
  
  useEffect(() => {
    getDocumentRequirements()
      .then(setDocumentRequirements)
      .catch(error => {
        console.error('Failed to load document requirements:', error);
        setDocumentRequirements(null);
      });
  }, []);
  
  const allRoleOptions = useMemo(() => {
    if (documentRequirements?.entityRoleMapping) {
      const fromTemplate = documentRequirements.entityRoleMapping[entityType as keyof typeof documentRequirements.entityRoleMapping];
      if (fromTemplate && fromTemplate.length > 0) {
        return fromTemplate;
      }
    }
    return ['Director', 'Shareholder', 'Authorised Signatory', 'Beneficial Owner'];
  }, [entityType, documentRequirements]);

  const availableRoles = useMemo(() => {
    const addedRoles = new Set(state.roles.map(r => r.type));
    return allRoleOptions.filter(opt => !addedRoles.has(opt));
  }, [allRoleOptions, state.roles]);

  const [currentRole, setCurrentRole] = useState(availableRoles[0] || '');

  useEffect(() => {
    setCurrentRole(availableRoles[0] || '');
  }, [availableRoles]);

  const showOwnership = useMemo(() =>
    state.roles.some(r => ['Shareholder', 'Beneficial Owner'].includes(r.type)),
    [state.roles]
  );

  const commonInputClass = 'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500';

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
          Roles for this Case *
        </label>
        <div className="flex gap-2">
          <select 
            value={currentRole} 
            onChange={e => setCurrentRole(e.target.value)} 
            disabled={availableRoles.length === 0}
            className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {availableRoles.length > 0 ? (
              availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))
            ) : (
              <option value="">All roles added</option>
            )}
          </select>
          <button 
            type="button" 
            onClick={() => {
              if (currentRole && availableRoles.includes(currentRole)) {
                dispatch({ type: 'ADD_ROLE', payload: currentRole });
              }
            }}
            disabled={!currentRole || availableRoles.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <PlusCircle size={16}/> Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 min-h-[32px]">
          {state.roles.map(role => (
            <span 
              key={role.type}
              className="inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
            >
              {role.type}
              <button 
                type="button" 
                onClick={() => dispatch({ type: 'REMOVE_ROLE', payload: role.type })}
                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                aria-label={`Remove ${role.type} role`}
              >
                &times;
              </button>
            </span>
          ))}
          {state.roles.length === 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
              No roles selected yet
            </span>
          )}
        </div>
      </div>
      
      {showOwnership && (
        <div>
          <label htmlFor="ownership" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            Ownership Percentage (%)
          </label>
          <input 
            id="ownership" 
            type="number" 
            value={state.ownership} 
            min={0} 
            max={100}
            onChange={e => dispatch({ type: 'UPDATE_OWNERSHIP', payload: e.target.value })}
            placeholder="e.g., 40" 
            required
            className={commonInputClass}
          />
        </div>
      )}
    </>
  );
};

export default function EditPartyModal({ 
  isOpen, 
  onClose, 
  onUpdateParty, 
  onRemoveParty,
  party,
  entityType,
  existingPartyIds = []
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpdateParty: (partyId: string, relationships: { type: string; ownershipPercentage?: number }[]) => void;
  onRemoveParty: (partyId: string) => void;
  party: EditPartyData | null;
  entityType: string;
  existingPartyIds?: string[];
}) {
  const initialState: State = {
    roles: party?.relationships || [],
    ownership: party?.relationships.find(r => ['Shareholder', 'Beneficial Owner'].includes(r.type))?.ownershipPercentage?.toString() || '',
    validationError: null,
  };

  const [state, dispatch] = useReducer(formReducer, initialState);

  // Reset form when party changes
  useEffect(() => {
    if (party) {
      dispatch({ 
        type: 'RESET_FORM', 
        payload: { 
          roles: party.relationships 
        } 
      });
    }
  }, [party]);

  if (!isOpen || !party) return null;

  const handleClose = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: null });

    if (state.roles.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'At least one role must be assigned.' });
      return;
    }

    const finalRoles = state.roles.map(r =>
      ['Shareholder', 'Beneficial Owner'].includes(r.type) && state.ownership
        ? { ...r, ownershipPercentage: parseInt(state.ownership, 10) }
        : { type: r.type },
    );

    onUpdateParty(party.partyId, finalRoles);
    handleClose();
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${party.name} from this case?`)) {
      onRemoveParty(party.partyId);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="p-6 md:p-8 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Edit Party: {party.name}
          </h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Party Details:</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {party.name}
            </p>
          </div>

          <div className="border-t pt-6 dark:border-slate-700">
            <RoleManager 
              state={state} 
              dispatch={dispatch} 
              entityType={entityType}
              existingPartyIds={existingPartyIds}
              currentPartyId={party.partyId}
            />
          </div>

          {state.validationError && (
             <p className="text-sm text-red-600 dark:text-red-400 text-center p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                {state.validationError}
             </p>
          )}

          <div className="flex justify-between gap-4 pt-4 border-t dark:border-slate-700">
            <button 
              type="button" 
              onClick={handleRemove}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Remove Party
            </button>
            
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={state.roles.length === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Party
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}