// // =================================================================================
// // FILE: src/features/case/components/AddPartyModal.tsx
// // =================================================================================
// 'use client';
// import React, { useReducer, useMemo, useEffect, useState } from 'react';
// import { X, UserPlus, Search, PlusCircle } from 'lucide-react';
// import type { Party, NewPartyData, DocumentRequirements } from '@/types/entities';
// import { getDocumentRequirements } from '@/lib/apiClient';

// // For better readability
// type Relationship = { type: string; ownershipPercentage?: number };

// // --- STATE & ACTIONS for useReducer ---
// interface State {
//   activeTab: 'create' | 'search';
//   // 'Create' tab fields
//   firstName: string;
//   lastName: string;
//   idType: string;
//   identityNo: string;
//   birthDate: string;
//   residencyStatus: string;
//   // 'Search' tab fields
//   searchTerm: string;
//   selectedParty: Party | null;
//   // Common fields
//   roles: Relationship[];
//   ownership: string;
//   validationError: string | null;
// }

// type Action =
//   | { type: 'SET_TAB'; payload: 'create' | 'search' }
//   | { type: 'UPDATE_FIELD'; payload: { field: keyof State; value: State[keyof State] } }
//   | { type: 'ADD_ROLE'; payload: string }
//   | { type: 'REMOVE_ROLE'; payload: string }
//   | { type: 'SELECT_PARTY'; payload: Party | null }
//   | { type: 'SET_ERROR'; payload: string | null }
//   | { type: 'RESET_FORM' };

// // MODIFIED: Changed default activeTab to 'search'
// const initialState: State = {
//   activeTab: 'search',
//   firstName: '',
//   lastName: '',
//   idType: 'NRIC',
//   identityNo: '',
//   birthDate: '',
//   residencyStatus: 'Singaporean/PR',
//   searchTerm: '',
//   selectedParty: null,
//   roles: [],
//   ownership: '',
//   validationError: null,
// };

// function formReducer(state: State, action: Action): State {
//   switch (action.type) {
//     case 'SET_TAB':
//       // Reset the other tab's specific state when switching
//       return {
//         ...initialState,
//         activeTab: action.payload,
//         roles: state.roles, // Keep roles when switching
//         ownership: state.ownership,
//       };
//     case 'UPDATE_FIELD':
//       return { ...state, [action.payload.field]: action.payload.value };
//     case 'ADD_ROLE':
//       if (action.payload && !state.roles.some(r => r.type === action.payload)) {
//         return { ...state, roles: [...state.roles, { type: action.payload }] };
//       }
//       return state;
//     case 'REMOVE_ROLE':
//       const newRoles = state.roles.filter(r => r.type !== action.payload);
//       const wasOwnershipRoleRemoved = !newRoles.some(r =>
//         ['Shareholder', 'Beneficial Owner'].includes(r.type),
//       );
//       return {
//         ...state,
//         roles: newRoles,
//         // Clear ownership if no ownership roles are left
//         ownership: wasOwnershipRoleRemoved ? '' : state.ownership,
//       };
//     case 'SELECT_PARTY':
//       return { ...state, selectedParty: action.payload, searchTerm: action.payload?.name || '' };
//     case 'SET_ERROR':
//       return { ...state, validationError: action.payload };
//     case 'RESET_FORM':
//       return initialState;
//     default:
//       return state;
//   }
// }

// // --- SUB-COMPONENTS for clarity ---

// const CreatePartyForm = ({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) => {
//   const commonInputClass = 'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500';
  
//   return (
//     <>
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             First Name *
//           </label>
//           <input 
//             id="firstName" 
//             type="text" 
//             value={state.firstName}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'firstName', value: e.target.value } })}
//             required 
//             className={commonInputClass}
//           />
//         </div>
//         <div>
//           <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             Last Name *
//           </label>
//           <input 
//             id="lastName" 
//             type="text" 
//             value={state.lastName}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'lastName', value: e.target.value } })}
//             required 
//             className={commonInputClass}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label htmlFor="idType" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             ID Type *
//           </label>
//           <select 
//             id="idType" 
//             value={state.idType}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'idType', value: e.target.value } })}
//             className={commonInputClass}
//           >
//             <option value="NRIC">NRIC</option>
//             <option value="Passport">Passport</option>
//             <option value="FIN">FIN</option>
//           </select>
//         </div>
//         <div>
//           <label htmlFor="identityNo" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             ID Number *
//           </label>
//           <input 
//             id="identityNo" 
//             type="text" 
//             value={state.identityNo}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'identityNo', value: e.target.value } })}
//             placeholder="e.g., S1234567A"
//             required 
//             className={commonInputClass}
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label htmlFor="birthDate" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             Date of Birth *
//           </label>
//           <input 
//             id="birthDate" 
//             type="date" 
//             value={state.birthDate}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'birthDate', value: e.target.value } })}
//             required 
//             className={commonInputClass}
//           />
//         </div>
//         <div>
//           <label htmlFor="residencyStatus" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             Residency Status *
//           </label>
//           <select 
//             id="residencyStatus" 
//             value={state.residencyStatus}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'residencyStatus', value: e.target.value } })}
//             className={commonInputClass}
//           >
//             <option value="Singaporean/PR">Singaporean/PR</option>
//             <option value="Foreigner">Foreigner</option>
//           </select>
//         </div>
//       </div>
//     </>
//   );
// };

// const SearchPartyForm = ({ state, dispatch, masterIndividuals }: { state: State; dispatch: React.Dispatch<Action>; masterIndividuals: Party[] }) => {
//   const searchResults = useMemo(() => {
//     if (!state.searchTerm || state.selectedParty) return [];
//     return masterIndividuals.filter(p =>
//       p.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
//       p.identityNo.toLowerCase().includes(state.searchTerm.toLowerCase())
//     );
//   }, [state.searchTerm, state.selectedParty, masterIndividuals]);

//   return (
//     <>
//       <div>
//         <label htmlFor="search" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//           Search by Name or ID
//         </label>
//         <div className="relative">
//           <input 
//             id="search" 
//             type="text" 
//             value={state.searchTerm}
//             onChange={e => {
//               dispatch({ type: 'SELECT_PARTY', payload: null });
//               dispatch({ type: 'UPDATE_FIELD', payload: { field: 'searchTerm', value: e.target.value } });
//             }}
//             placeholder="Start typing name or ID number..."
//             className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
//           />
//           {state.selectedParty && (
//             <button 
//               type="button" 
//               onClick={() => dispatch({ type: 'SELECT_PARTY', payload: null })}
//               className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:underline"
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>
      
//       {state.selectedParty ? (
//         <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
//           <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Selected Party:</p>
//           <p className="text-sm text-blue-700 dark:text-blue-300">
//             {state.selectedParty.name} ({state.selectedParty.idType}: {state.selectedParty.identityNo})
//           </p>
//         </div>
//       ) : searchResults.length > 0 && (
//         <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-slate-900/50 dark:border-slate-600">
//           {searchResults.map(p => (
//             <div 
//               key={p.partyId} 
//               onClick={() => dispatch({ type: 'SELECT_PARTY', payload: p })}
//               className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 border-b last:border-b-0 dark:border-slate-700"
//             >
//               <p className="text-sm font-medium">{p.name}</p>
//               <p className="text-xs text-slate-500 dark:text-slate-400">
//                 {p.idType}: {p.identityNo} • {p.residencyStatus}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}
//     </>
//   );
// };

// const RoleManager = ({ state, dispatch, entityType }: { state: State; dispatch: React.Dispatch<Action>; entityType: string }) => {
//   const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirements | null>(null);
  
//   useEffect(() => {
//     getDocumentRequirements()
//       .then(setDocumentRequirements)
//       .catch(error => {
//         console.error('Failed to load document requirements:', error);
//         setDocumentRequirements(null);
//       });
//   }, []);
  
//   const allRoleOptions = useMemo(() => {
//     if (documentRequirements?.entityRoleMapping) {
//       const fromTemplate = documentRequirements.entityRoleMapping[entityType as keyof typeof documentRequirements.entityRoleMapping];
//       if (fromTemplate && fromTemplate.length > 0) {
//         return fromTemplate;
//       }
//     }
//     return ['Director', 'Shareholder', 'Authorised Signatory', 'Beneficial Owner'];
//   }, [entityType, documentRequirements]);

//   const availableRoles = useMemo(() => {
//     const addedRoles = new Set(state.roles.map(r => r.type));
//     return allRoleOptions.filter(opt => !addedRoles.has(opt));
//   }, [allRoleOptions, state.roles]);

//   const [currentRole, setCurrentRole] = useState(availableRoles[0] || '');

//   useEffect(() => {
//     setCurrentRole(availableRoles[0] || '');
//   }, [availableRoles]);

//   const showOwnership = useMemo(() =>
//     state.roles.some(r => ['Shareholder', 'Beneficial Owner'].includes(r.type)),
//     [state.roles]
//   );

//   return (
//     <>
//       <div>
//         <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//           Roles for this Case *
//         </label>
//         <div className="flex gap-2">
//           <select 
//             value={currentRole} 
//             onChange={e => setCurrentRole(e.target.value)} 
//             disabled={availableRoles.length === 0}
//             className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
//           >
//             {availableRoles.length > 0 ? (
//               availableRoles.map(role => (
//                 <option key={role} value={role}>{role}</option>
//               ))
//             ) : (
//               <option value="">All roles added</option>
//             )}
//           </select>
//           <button 
//             type="button" 
//             onClick={() => {
//               if (currentRole && availableRoles.includes(currentRole)) {
//                 dispatch({ type: 'ADD_ROLE', payload: currentRole });
//               }
//             }}
//             disabled={!currentRole || availableRoles.length === 0}
//             className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
//           >
//             <PlusCircle size={16}/> Add
//           </button>
//         </div>
//         <div className="mt-2 flex flex-wrap gap-2 min-h-[32px]">
//           {state.roles.map(role => (
//             <span 
//               key={role.type}
//               className="inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
//             >
//               {role.type}
//               <button 
//                 type="button" 
//                 onClick={() => dispatch({ type: 'REMOVE_ROLE', payload: role.type })}
//                 className="ml-1 text-red-500 hover:text-red-700 font-bold"
//                 aria-label={`Remove ${role.type} role`}
//               >
//                 &times;
//               </button>
//             </span>
//           ))}
//           {state.roles.length === 0 && (
//             <span className="text-xs text-gray-500 dark:text-gray-400 italic">
//               No roles selected yet
//             </span>
//           )}
//         </div>
//       </div>
      
//       {showOwnership && (
//         <div>
//           <label htmlFor="ownership" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
//             Ownership Percentage (%)
//           </label>
//           <input 
//             id="ownership" 
//             type="number" 
//             value={state.ownership} 
//             min={0} 
//             max={100}
//             onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'ownership', value: e.target.value } })}
//             placeholder="e.g., 40" 
//             required
//             className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       )}
//     </>
//   );
// };

// // --- MAIN COMPONENT ---
// export default function AddPartyModal({ 
//   isOpen, 
//   onClose, 
//   onAddParty, 
//   masterIndividuals, 
//   entityType 
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onAddParty: (partyData: NewPartyData) => void;
//   masterIndividuals: Party[];
//   entityType: string;
// }) {
//   const [state, dispatch] = useReducer(formReducer, initialState);

//   if (!isOpen) return null;

//   const handleClose = () => {
//     dispatch({ type: 'RESET_FORM' });
//     onClose();
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     dispatch({ type: 'SET_ERROR', payload: null });

//     if (state.roles.length === 0) {
//       dispatch({ type: 'SET_ERROR', payload: 'At least one role must be assigned.' });
//       return;
//     }
    
//     if (state.activeTab === 'create') {
//       if (!state.firstName.trim() || !state.lastName.trim()) {
//         dispatch({ type: 'SET_ERROR', payload: 'First name and last name are required.' });
//         return;
//       }
//       if (!state.identityNo.trim()) {
//         dispatch({ type: 'SET_ERROR', payload: 'ID number is required.' });
//         return;
//       }
//       if (!state.birthDate) {
//         dispatch({ type: 'SET_ERROR', payload: 'Date of birth is required.' });
//         return;
//       }
//     }
    
//     if (state.activeTab === 'search' && !state.selectedParty) {
//       dispatch({ type: 'SET_ERROR', payload: 'An existing party must be selected.' });
//       return;
//     }

//     const finalRoles = state.roles.map(r =>
//       ['Shareholder', 'Beneficial Owner'].includes(r.type) && state.ownership
//         ? { ...r, ownershipPercentage: parseInt(state.ownership, 10) }
//         : { type: r.type },
//     );

//     let partyData: NewPartyData;
//     if (state.activeTab === 'create') {
//       partyData = { 
//         name: `${state.firstName} ${state.lastName}`.trim(),
//         firstName: state.firstName.trim(),
//         lastName: state.lastName.trim(),
//         idType: state.idType,
//         identityNo: state.identityNo.trim(),
//         birthDate: state.birthDate,
//         residencyStatus: state.residencyStatus, 
//         relationships: finalRoles 
//       };
//     } else { 
//       partyData = { 
//         partyId: state.selectedParty!.partyId, 
//         relationships: finalRoles 
//       };
//     }

//     onAddParty(partyData);
//     handleClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
//       <div className="p-6 md:p-8 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg flex flex-col">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Related Party</h3>
//           <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
//             <X size={20} />
//           </button>
//         </div>

//         <div className="border-b border-gray-200 dark:border-slate-600 mb-6">
//           <div className="flex -mb-px">
//             {/* MODIFIED: Reordered tabs to have 'search' first */}
//             {(['search', 'create'] as const).map(tab => (
//               <button 
//                 key={tab} 
//                 onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
//                 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 capitalize ${
//                   state.activeTab === tab
//                     ? 'border-blue-500 text-blue-600 dark:text-blue-400'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
//                 }`}
//               >
//                 {tab === 'create' ? <UserPlus size={16}/> : <Search size={16}/>}
//                 {tab === 'create' ? 'Create New' : 'Search Existing'}
//               </button>
//             ))}
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {state.activeTab === 'create' ? (
//             <CreatePartyForm state={state} dispatch={dispatch} />
//           ) : (
//             <SearchPartyForm state={state} dispatch={dispatch} masterIndividuals={masterIndividuals} />
//           )}

//           <div className="border-t pt-6 dark:border-slate-700">
//             <RoleManager state={state} dispatch={dispatch} entityType={entityType} />
//           </div>

//           {state.validationError && (
//              <p className="text-sm text-red-600 dark:text-red-400 text-center p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
//                 {state.validationError}
//              </p>
//           )}

//           <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
//             <button 
//               type="button" 
//               onClick={handleClose}
//               className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               disabled={state.roles.length === 0}
//               className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Add Party
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// =================================================================================
// FILE: src/features/case/components/AddPartyModal.tsx
// =================================================================================
'use client';
import React, { useReducer, useMemo, useEffect, useState } from 'react';
import { X, UserPlus, Search, PlusCircle } from 'lucide-react';
import type { Party, NewPartyData, DocumentRequirements } from '@/types/entities';
import { getDocumentRequirements } from '@/lib/apiClient';

// For better readability
type Relationship = { type: string; ownershipPercentage?: number };

// --- STATE & ACTIONS for useReducer ---
interface State {
  activeTab: 'create' | 'search';
  // 'Create' tab fields
  firstName: string;
  lastName: string;
  idType: string;
  identityNo: string;
  birthDate: string;
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
  | { type: 'UPDATE_FIELD'; payload: { field: keyof State; value: State[keyof State] } }
  | { type: 'ADD_ROLE'; payload: string }
  | { type: 'REMOVE_ROLE'; payload: string }
  | { type: 'SELECT_PARTY'; payload: Party | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' };

// MODIFIED: Changed default activeTab to 'search'
const initialState: State = {
  activeTab: 'search',
  firstName: '',
  lastName: '',
  idType: 'NRIC',
  identityNo: '',
  birthDate: '',
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

const CreatePartyForm = ({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) => {
  const commonInputClass = 'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500';
  
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            First Name *
          </label>
          <input 
            id="firstName" 
            type="text" 
            value={state.firstName}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'firstName', value: e.target.value } })}
            required 
            className={commonInputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            Last Name *
          </label>
          <input 
            id="lastName" 
            type="text" 
            value={state.lastName}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'lastName', value: e.target.value } })}
            required 
            className={commonInputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="idType" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            ID Type *
          </label>
          <select 
            id="idType" 
            value={state.idType}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'idType', value: e.target.value } })}
            className={commonInputClass}
          >
            <option value="NRIC">NRIC</option>
            <option value="Passport">Passport</option>
            <option value="FIN">FIN</option>
          </select>
        </div>
        <div>
          <label htmlFor="identityNo" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            ID Number *
          </label>
          <input 
            id="identityNo" 
            type="text" 
            value={state.identityNo}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'identityNo', value: e.target.value } })}
            placeholder="e.g., S1234567A"
            required 
            className={commonInputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            Date of Birth *
          </label>
          <input 
            id="birthDate" 
            type="date" 
            value={state.birthDate}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'birthDate', value: e.target.value } })}
            required 
            className={commonInputClass}
          />
        </div>
        <div>
          <label htmlFor="residencyStatus" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
            Residency Status *
          </label>
          <select 
            id="residencyStatus" 
            value={state.residencyStatus}
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'residencyStatus', value: e.target.value } })}
            className={commonInputClass}
          >
            <option value="Singaporean/PR">Singaporean/PR</option>
            <option value="Foreigner">Foreigner</option>
          </select>
        </div>
      </div>
    </>
  );
};

const SearchPartyForm = ({ 
  state, 
  dispatch, 
  masterIndividuals,
  existingPartyIds = [] // FIX: Add this prop
}: { 
  state: State; 
  dispatch: React.Dispatch<Action>; 
  masterIndividuals: Party[];
  existingPartyIds?: string[]; // FIX: Add this type
}) => {
  const searchResults = useMemo(() => {
    if (!state.searchTerm || state.selectedParty) return [];
    return masterIndividuals.filter(p =>
      p.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      p.identityNo.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  }, [state.searchTerm, state.selectedParty, masterIndividuals]);

  return (
    <>
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">
          Search by Name or ID
        </label>
        <div className="relative">
          <input 
            id="search" 
            type="text" 
            value={state.searchTerm}
            onChange={e => {
              dispatch({ type: 'SELECT_PARTY', payload: null });
              dispatch({ type: 'UPDATE_FIELD', payload: { field: 'searchTerm', value: e.target.value } });
            }}
            placeholder="Start typing name or ID number..."
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          />
          {state.selectedParty && (
            <button 
              type="button" 
              onClick={() => dispatch({ type: 'SELECT_PARTY', payload: null })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {state.selectedParty ? (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Selected Party:</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {state.selectedParty.name} ({state.selectedParty.idType}: {state.selectedParty.identityNo})
          </p>
          {/* FIX: Show warning if already added */}
          {existingPartyIds.includes(state.selectedParty.partyId) && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ This party is already added to this case
            </p>
          )}
        </div>
      ) : searchResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-slate-900/50 dark:border-slate-600">
          {searchResults.map(p => {
            const isAlreadyAdded = existingPartyIds.includes(p.partyId);
            return (
              <div 
                key={p.partyId} 
                onClick={() => dispatch({ type: 'SELECT_PARTY', payload: p })}
                className={`p-3 cursor-pointer border-b last:border-b-0 dark:border-slate-700 ${
                  isAlreadyAdded 
                    ? 'bg-gray-100 dark:bg-slate-800 opacity-75' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.idType}: {p.identityNo} • {p.residencyStatus}
                    </p>
                  </div>
                  {isAlreadyAdded && (
                    <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 px-2 py-1 rounded">
                      Already Added
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

const RoleManager = ({ state, dispatch, entityType }: { state: State; dispatch: React.Dispatch<Action>; entityType: string }) => {
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
            onChange={e => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'ownership', value: e.target.value } })}
            placeholder="e.g., 40" 
            required
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </>
  );
};

// --- MAIN COMPONENT ---
export default function AddPartyModal({ 
  isOpen, 
  onClose, 
  onAddParty, 
  masterIndividuals, 
  entityType,
  existingPartyIds = [] // FIX: Add new prop to receive existing parties in the case
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddParty: (partyData: NewPartyData) => void;
  masterIndividuals: Party[];
  entityType: string;
  existingPartyIds?: string[]; // FIX: New prop type
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

    if (state.roles.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'At least one role must be assigned.' });
      return;
    }
    
    if (state.activeTab === 'create') {
      if (!state.firstName.trim() || !state.lastName.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'First name and last name are required.' });
        return;
      }
      if (!state.identityNo.trim()) {
        dispatch({ type: 'SET_ERROR', payload: 'ID number is required.' });
        return;
      }
      if (!state.birthDate) {
        dispatch({ type: 'SET_ERROR', payload: 'Date of birth is required.' });
        return;
      }
      
      // FIX: Check if a party with the same ID number already exists in the case
      const isDuplicateIdInCase = masterIndividuals.some(p => 
        p.identityNo === state.identityNo.trim() && 
        existingPartyIds.includes(p.partyId)
      );
      
      if (isDuplicateIdInCase) {
        dispatch({ type: 'SET_ERROR', payload: 'A party with this ID number is already added to this case.' });
        return;
      }
    }
    
    if (state.activeTab === 'search') {
      if (!state.selectedParty) {
        dispatch({ type: 'SET_ERROR', payload: 'An existing party must be selected.' });
        return;
      }
      
      // FIX: Check if the selected party is already added to the case
      if (existingPartyIds.includes(state.selectedParty.partyId)) {
        dispatch({ type: 'SET_ERROR', payload: 'This party is already added to this case.' });
        return;
      }
    }

    const finalRoles = state.roles.map(r =>
      ['Shareholder', 'Beneficial Owner'].includes(r.type) && state.ownership
        ? { ...r, ownershipPercentage: parseInt(state.ownership, 10) }
        : { type: r.type },
    );

    let partyData: NewPartyData;
    if (state.activeTab === 'create') {
      partyData = { 
        name: `${state.firstName} ${state.lastName}`.trim(),
        firstName: state.firstName.trim(),
        lastName: state.lastName.trim(),
        idType: state.idType,
        identityNo: state.identityNo.trim(),
        birthDate: state.birthDate,
        residencyStatus: state.residencyStatus, 
        relationships: finalRoles 
      };
    } else { 
      partyData = { 
        partyId: state.selectedParty!.partyId, 
        relationships: finalRoles 
      };
    }

    onAddParty(partyData);
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="p-6 md:p-8 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Related Party</h3>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-slate-600 mb-6">
          <div className="flex -mb-px">
            {/* MODIFIED: Reordered tabs to have 'search' first */}
            {(['search', 'create'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => dispatch({ type: 'SET_TAB', payload: tab })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 capitalize ${
                  state.activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'create' ? <UserPlus size={16}/> : <Search size={16}/>}
                {tab === 'create' ? 'Create New' : 'Search Existing'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {state.activeTab === 'create' ? (
            <CreatePartyForm state={state} dispatch={dispatch} />
          ) : (
            <SearchPartyForm 
              state={state} 
              dispatch={dispatch} 
              masterIndividuals={masterIndividuals}
              existingPartyIds={existingPartyIds} // FIX: Pass existing party IDs
            />
          )}

          <div className="border-t pt-6 dark:border-slate-700">
            <RoleManager state={state} dispatch={dispatch} entityType={entityType} />
          </div>

          {state.validationError && (
             <p className="text-sm text-red-600 dark:text-red-400 text-center p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                {state.validationError}
             </p>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
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
              Add Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}