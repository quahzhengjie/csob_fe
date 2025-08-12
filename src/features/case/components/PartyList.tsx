// =================================================================================
// FILE: src/features/case/components/PartyList.tsx
// =================================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { User, Plus } from 'lucide-react';
import type { Case, Party } from '@/types/entities';
import { WithPermission } from '@/features/rbac/WithPermission';

interface PartyListProps {
    caseData: Case;
    parties: Party[];
    // CORRECTED: The prop should be a simple function with no arguments
    onAddParty: () => void;
}

export function PartyList({ caseData, parties, onAddParty }: PartyListProps) {
    const relatedParties = caseData.relatedPartyLinks.map(link => {
        const partyDetails = parties.find(p => p.partyId === link.partyId);
        return { ...partyDetails, relationships: link.relationships };
    });

    return (
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Related Parties</h3>
                <WithPermission permission="case:update">
                    <button onClick={onAddParty} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                        <Plus size={14}/>Add Party
                    </button>
                </WithPermission>
            </div>
            <div className="space-y-4">
                {relatedParties.map(party => (
                    <div key={party.partyId} className="p-4 rounded-lg flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600">
                                <User size={20} className="text-gray-500 dark:text-slate-300" />
                            </div>
                            <div>
                                <Link href={`/parties/${party.partyId}`} className="font-medium text-slate-800 dark:text-slate-100 hover:underline">
                                    {party.name}
                                </Link>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {party.relationships.map(r => r.type).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}