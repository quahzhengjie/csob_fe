// =================================================================================
// FILE: src/features/case/components/PartyList.tsx - UPDATED WITH EDIT FUNCTIONALITY
// =================================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { User, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Case, Party } from '@/types/entities';
import { WithPermission } from '@/features/rbac/WithPermission';

interface PartyListProps {
    caseData: Case;
    parties: Party[];
    onAddParty: () => void;
    onEditParty: (partyId: string, name: string, relationships: { type: string; ownershipPercentage?: number }[]) => void;
    onRemoveParty: (partyId: string, name: string) => void;
}

export function PartyList({ caseData, parties, onAddParty, onEditParty, onRemoveParty }: PartyListProps) {
    const relatedParties = caseData.relatedPartyLinks.map(link => {
        const partyDetails = parties.find(p => p.partyId === link.partyId);
        return { 
            ...partyDetails, 
            relationships: link.relationships,
            partyId: link.partyId // Ensure partyId is available
        };
    });

    const handleQuickRemove = (partyId: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove ${name} from this case?`)) {
            onRemoveParty(partyId, name);
        }
    };

    return (
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Related Parties</h3>
                <WithPermission permission="case:update">
                    <button 
                        onClick={onAddParty} 
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                        <Plus size={14}/>Add Party
                    </button>
                </WithPermission>
            </div>
            
            <div className="space-y-4">
                {relatedParties.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                        <User size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No related parties added yet</p>
                        <WithPermission permission="case:update">
                            <button 
                                onClick={onAddParty}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Add the first party
                            </button>
                        </WithPermission>
                    </div>
                ) : (
                    relatedParties.map(party => (
                        <div key={party.partyId} className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600">
                                        <User size={20} className="text-gray-500 dark:text-slate-300" />
                                    </div>
                                    <div className="flex-1">
                                        <Link 
                                            href={`/parties/${party.partyId}`} 
                                            className="font-medium text-slate-800 dark:text-slate-100 hover:underline"
                                        >
                                            {party.name || 'Unknown Party'}
                                        </Link>
                                        <div className="mt-1">
                                            <div className="flex flex-wrap gap-1">
                                                {party.relationships?.map((relationship, index) => (
                                                    <span 
                                                        key={`${relationship.type}-${index}`}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                                                    >
                                                        {relationship.type}
                                                        {relationship.ownershipPercentage && (
                                                            <span className="ml-1 text-blue-600 dark:text-blue-300">
                                                                ({relationship.ownershipPercentage}%)
                                                            </span>
                                                        )}
                                                    </span>
                                                )) || (
                                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                                        No roles assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <WithPermission permission="case:update">
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => onEditParty(
                                                party.partyId, 
                                                party.name || 'Unknown Party',
                                                party.relationships || []
                                            )}
                                            className="p-1.5 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Edit party roles"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleQuickRemove(party.partyId, party.name || 'Unknown Party')}
                                            className="p-1.5 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                            title="Remove party from case"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </WithPermission>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}