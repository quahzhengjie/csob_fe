// =================================================================================
// FILE: src/features/admin/components/TemplateManagerView.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { ChevronRight, Edit } from 'lucide-react';
import { updateMockTemplate } from '@/lib/apiClient';
import EditTemplateModal from './EditTemplateModal';
import type { TemplateDoc } from '@/types/entities';

// src/types/entities.ts  (or wherever TemplateData lives)
export interface TemplateData {
    individualTemplates: Record<string, TemplateDoc[]>;
    entityTemplates:    Record<string, TemplateDoc[]>;
    bankFormTemplates: {
      corporateMandatory:   string[];
      corporateOptional:    string[];
      individualStakeholder: string[];
    };
    riskBasedDocuments:  Record<string, TemplateDoc[]>;
    entityRoleMapping:   Record<string, string[]>;
  }
  

interface TemplateManagerViewProps {
    initialTemplates: TemplateData;
}

// A generic card for displaying lists of items within a panel
const ListCard = ({ title, items }: { title: string, items: string[] }) => (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 h-full">
        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
        <ul className="space-y-1 text-sm list-disc list-inside text-slate-600 dark:text-slate-400">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

// The card for templates that can be edited
const TemplateCard = ({ title, documents, onEdit }: { title: string, documents: TemplateDoc[], onEdit: () => void }) => (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-slate-800 dark:text-slate-200">{title}</h4>
            <button onClick={onEdit} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-md">
                <Edit size={16}/>
            </button>
        </div>
        <div className="flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {documents.map((doc, i) => (
                <div key={i}>
                    <p className="font-medium text-slate-700 dark:text-slate-300">- {doc.name}</p>
                    {doc.description && <p className="pl-4 text-xs italic">{doc.description}</p>}
                    {doc.validityMonths && <p className="pl-4 text-xs font-mono text-blue-600 dark:text-blue-400">({doc.validityMonths}m validity)</p>}
                </div>
            ))}
        </div>
    </div>
);

// A self-contained, collapsible panel for each template category
const AccordionPanel = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                <ChevronRight className={`text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="pt-6">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};


export function TemplateManagerView({ initialTemplates }: TemplateManagerViewProps) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [editingTemplate, setEditingTemplate] = useState<{ type: string, documents: TemplateDoc[] } | null>(null);

    const handleSaveTemplate = async (entityType: string, newDocs: TemplateDoc[]) => {
        const updatedTemplates = await updateMockTemplate(entityType, newDocs);
        if (updatedTemplates) {
            setTemplates(updatedTemplates as TemplateData);
        }
    };
    
    return (
        <>
            <EditTemplateModal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                templateData={editingTemplate}
                onSave={handleSaveTemplate}
            />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Template Manager</h1>

                <AccordionPanel title="Entity Templates">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.entityTemplates).map(([key, value]) => (
                            <TemplateCard key={key} title={key} documents={value} onEdit={() => setEditingTemplate({ type: key, documents: value })} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Individual Templates">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.individualTemplates).map(([key, value]) => (
                             <TemplateCard key={key} title={key} documents={value} onEdit={() => alert('Editing this template type is not yet implemented.')} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Bank Form Templates">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.bankFormTemplates).map(([key, value]) => (
                             <ListCard key={key} title={key} items={value} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Risk Based Documents">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.riskBasedDocuments).map(([key, value]) => (
                             <TemplateCard key={key} title={key} documents={value} onEdit={() => alert('Editing this template type is not yet implemented.')} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Entity Role Mapping">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.entityRoleMapping).map(([key, value]) => (
                             <ListCard key={key} title={key} items={value} />
                        ))}
                    </div>
                </AccordionPanel>
            </div>
        </>
    );
}