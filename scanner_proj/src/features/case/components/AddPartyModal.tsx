// =================================================================================
// FILE: src/features/case/components/AddPartyModal.refactored.tsx
// =================================================================================
'use client';

import React, { useReducer, useMemo, useEffect, useState } from 'react';
import { X, UserPlus, Search, PlusCircle } from 'lucide-react';
import type { Party, NewPartyData } from '@/types/entities';
import { documentRequirementsTemplate } from '@/data/mockData';

// For better readability
type Relationship = { type: string; ownershipPercentage?: number };

// --- STATE & ACTIONS for useReducer ---
interface State {
  activeTab: 'create' | 'search';
  // 'Create' tab fields
  name: string;
  residencyStatus: string;
  // 'Search' tab fields
  searchTerm: string;
  selectedParty: Party | null;
  // Common fields
  roles: Relationship[];
  ownership: string;
  validationError: string | null;
}

type Action =
  | { type: 'SET_TAB'; payload: 'create' | 'search' }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof State; // This ensures the value is one of the types from the State interface, removing 'any'.
    value: State[keyof State];};}
  | { type: 'ADD_ROLE'; payload: string }
  | { type: 'REMOVE_ROLE'; payload: string }
  | { type: 'SELECT_PARTY'; payload: Party | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' };
const initialState: State = {
  activeTab: 'create',
  name: '',
  residencyStatus: 'Singaporean/PR',
  searchTerm: '',
  selectedParty: null,
  roles: [],
  ownership: '',
  validationError: null,
};

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB':
      // Reset the other tab's specific state when switching
      return {
        ...initialState,
        activeTab: action.payload,
        roles: state.roles, // Keep roles when switching
        ownership: state.ownership,
      };
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
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
        // Clear ownership if no ownership roles are left
        ownership: wasOwnershipRoleRemoved ? '' : state.ownership,
      };
    case 'SELECT_PARTY':
      return { ...state, selectedParty: action.payload, searchTerm: action.payload?.name || '' };
    case 'SET_ERROR':
      return { ...state, validationError: action.payload };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

// --- SUB-COMPONENTS for clarity ---

const CreatePartyForm = ({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) => (
  <>
    <div>
      <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
        Full Name
      </label>
      <input id="name" type="text" value={state.name}
        onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'name', value: e.target.value } })}
        required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
      />
    </div>
    <div>
      <label htmlFor="residencyStatus" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
        Residency Status
      </label>
      <select id="residencyStatus" value={state.residencyStatus}
        onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'residencyStatus', value: e.target.value } })}
        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
      >
        <option>Singaporean/PR</option>
        <option>Foreigner</option>
      </select>
    </div>
  </>
);

const SearchPartyForm = ({ state, dispatch, masterIndividuals }: { state: State; dispatch: React.Dispatch<Action>; masterIndividuals: Party[] }) => {
  const searchResults = useMemo(() => {
    if (!state.searchTerm || state.selectedParty) return [];
    return masterIndividuals.filter(p =>
      p.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
    );
  }, [state.searchTerm, state.selectedParty, masterIndividuals]);

  return (
    <>
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
          Search by Name
        </label>
        <div className="relative">
          <input id="search" type="text" value={state.searchTerm}
            onChange={e => {
              dispatch({ type: 'SELECT_PARTY', payload: null });
              dispatch({ type: 'UPDATE_FIELD', payload: { field: 'searchTerm', value: e.target.value } });
            }}
            placeholder="Start typing to search..."
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          />
          {state.selectedParty && (
            <button type="button" onClick={() => dispatch({ type: 'SELECT_PARTY', payload: null })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>
      {searchResults.length > 0 && (
        <div className="max-h-32 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-slate-900/50 dark:border-slate-600">
          {searchResults.map(p => (
            <div key={p.partyId} onClick={() => dispatch({ type: 'SELECT_PARTY', payload: p })}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
              {p.name} <span className="text-xs text-slate-400">({p.idType}: {p.identityNo})</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const RoleManager = ({ state, dispatch, entityType }: { state: State; dispatch: React.Dispatch<Action>; entityType: string; }) => {
  const allRoleOptions = useMemo(() => {
    const fromTemplate = documentRequirementsTemplate.entityRoleMapping[entityType as keyof typeof documentRequirementsTemplate.entityRoleMapping] || [];
    return fromTemplate.length > 0 ? fromTemplate : ['Director', 'Shareholder', 'Authorised Signatory'];
  }, [entityType]);

  // ✨ UX Improvement: Don't let users add a role that's already been added.
  const availableRoles = useMemo(() => {
    const addedRoles = new Set(state.roles.map(r => r.type));
    return allRoleOptions.filter(opt => !addedRoles.has(opt));
  }, [allRoleOptions, state.roles]);

  const [currentRole, setCurrentRole] = useState(availableRoles[0] || '');

  useEffect(() => {
    // Reset selection if available roles change
    setCurrentRole(availableRoles[0] || '');
  }, [availableRoles]);

  const showOwnership = useMemo(() =>
    state.roles.some(r => ['Shareholder', 'Beneficial Owner'].includes(r.type)),
    [state.roles]
  );

  return (
    <>
      {/* --- Role Input --- */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
          Roles for this Case
        </label>
        <div className="flex gap-2">
          <select value={currentRole} onChange={e => setCurrentRole(e.target.value)} disabled={availableRoles.length === 0}
            className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 disabled:bg-slate-100"
          >
            {availableRoles.length > 0 ? (
                availableRoles.map(r => <option key={r} value={r}>{r}</option>)
            ) : (
                <option>All roles added</option>
            )}
          </select>
          <button type="button" onClick={() => dispatch({ type: 'ADD_ROLE', payload: currentRole })}
            disabled={!currentRole}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusCircle size={16}/> Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 min-h-[28px]">
          {state.roles.map(role => (
            <span key={role.type}
              className="inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
            >
              {role.type}
              <button type="button" onClick={() => dispatch({ type: 'REMOVE_ROLE', payload: role.type })}
                className="ml-1 text-red-500 hover:text-red-700 font-bold">
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>
      {/* --- Ownership Input --- */}
      {showOwnership && (
        <div>
          <label htmlFor="ownership" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            Ownership Percentage (%)
          </label>
          <input id="ownership" type="number" value={state.ownership} min={0} max={100}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'ownership', value: e.target.value } })}
            placeholder="e.g., 40" required
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
      )}
    </>
  );
};


// --- MAIN COMPONENT ---
export default function AddPartyModal({ isOpen, onClose, onAddParty, masterIndividuals, entityType }: {
  isOpen: boolean;
  onClose: () => void;
  onAddParty: (partyData: NewPartyData) => void;
  masterIndividuals: Party[];
  entityType: string;
}) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch({ type: 'RESET_FORM' });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: null });

    // --- Validation ---
    if (state.roles.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'At least one role must be assigned.' });
      return;
    }
    if (state.activeTab === 'create' && !state.name.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Full Name is required for a new party.' });
      return;
    }
    if (state.activeTab === 'search' && !state.selectedParty) {
      dispatch({ type: 'SET_ERROR', payload: 'An existing party must be selected.' });
      return;
    }

    // --- Data Preparation ---
    const finalRoles = state.roles.map(r =>
      ['Shareholder', 'Beneficial Owner'].includes(r.type) && state.ownership
        ? { ...r, ownershipPercentage: parseInt(state.ownership, 10) }
        : { type: r.type },
    );

    let partyData: NewPartyData;
    if (state.activeTab === 'create') {
      partyData = { name: state.name.trim(), residencyStatus: state.residencyStatus, relationships: finalRoles };
    } else { // Search tab
      partyData = { partyId: state.selectedParty!.partyId, relationships: finalRoles };
    }

    onAddParty(partyData);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="p-6 md:p-8 rounded-xl border w-full max-w-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg flex flex-col">
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Related Party</h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={20} /></button>
        </div>

        {/* --- Tab Switch --- */}
        <div className="border-b border-gray-200 dark:border-slate-600 mb-6">
          <div className="flex -mb-px">
            {(['create', 'search'] as const).map(tab => (
              <button key={tab} onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 capitalize ${
                  state.activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'create' ? <UserPlus size={16}/> : <Search size={16}/>}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- Form --- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {state.activeTab === 'create' ? (
            <CreatePartyForm state={state} dispatch={dispatch} />
          ) : (
            <SearchPartyForm state={state} dispatch={dispatch} masterIndividuals={masterIndividuals} />
          )}

          <RoleManager state={state} dispatch={dispatch} entityType={entityType} />

          {state.validationError && (
             <p className="text-sm text-red-600 dark:text-red-400 text-center p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                {state.validationError}
             </p>
          )}

          {/* --- Action Buttons --- */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={state.roles.length === 0}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Add Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}