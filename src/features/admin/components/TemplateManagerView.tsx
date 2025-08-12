// =================================================================================
// FILE: src/features/admin/components/TemplateManagerView.tsx
// =================================================================================
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import { updateTemplate, getDocumentRequirements } from '@/lib/apiClient';
import EditTemplateModal from './EditTemplateModal';
import type { TemplateDoc, TemplateManagerViewProps } from '@/types/entities';

// No changes needed for ListCard
const ListCard = ({ title, items }: { title: string, items: string[] }) => (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 h-full">
        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
        <ul className="space-y-1 text-sm list-disc list-inside text-slate-600 dark:text-slate-400">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const TemplateCard = ({ title, documents, onEdit }: { title: string, documents: TemplateDoc[], onEdit: () => void }) => {
    const groupedDocuments = {
        CUSTOMER: documents.filter(d => d.category === 'CUSTOMER'),
        BANK_MANDATORY: documents.filter(d => d.category === 'BANK_MANDATORY'),
        BANK_NON_MANDATORY: documents.filter(d => d.category === 'BANK_NON_MANDATORY'),
    };

    const categoryTitles = {
        CUSTOMER: 'Mandatory from Customer',
        BANK_MANDATORY: 'Mandatory Bank Documents',
        BANK_NON_MANDATORY: 'Non-Mandatory Documents',
    };

    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-slate-800 dark:text-slate-200">{title}</h4>
                <button
                    onClick={onEdit}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                    title="Edit template"
                >
                    <Edit size={16}/>
                </button>
            </div>
            <div className="flex-1 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {documents.length === 0 ? (
                    <p className="italic text-slate-500">No documents configured</p>
                ) : (
                    Object.entries(groupedDocuments).map(([category, docs]) => {
                        if (docs.length === 0) return null;
                        return (
                            <div key={category}>
                                <h5 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                    {categoryTitles[category as keyof typeof categoryTitles]}
                                </h5>
                                <div className="space-y-1">
                                    {docs.map((doc, i) => (
                                        <div key={i}>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                • {doc.name} {doc.required !== false && <span className="text-red-500">*</span>}
                                            </p>
                                            {doc.description && <p className="pl-4 text-xs italic">{doc.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const AccordionPanel = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                <ChevronRight className={`text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="pt-6">{children}</div>
                </div>
            )}
        </div>
    );
};

export function TemplateManagerView({ initialTemplates }: TemplateManagerViewProps) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [editingTemplate, setEditingTemplate] = useState<{
        category: 'entity' | 'individual' | 'risk';
        type: string;
        documents: TemplateDoc[];
    } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshTemplates = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const freshTemplates = await getDocumentRequirements();
            setTemplates(freshTemplates);
            setUpdateError(null);
        } catch (error) {
            console.error('Failed to refresh templates:', error);
            setUpdateError('Failed to refresh templates. Please reload the page.');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        refreshTemplates();
    }, [refreshTemplates]);

    const handleSaveTemplate = useCallback(async (type: string, newDocs: TemplateDoc[]) => {
        if (!editingTemplate) return;
        setIsUpdating(true);
        setUpdateError(null);
        try {
            const categoryKeyMap = {
                'entity': 'entityTemplates',
                'individual': 'individualTemplates',
                'risk': 'riskBasedDocuments'
            };
            const categoryKey = categoryKeyMap[editingTemplate.category];
            const result = await updateTemplate(categoryKey, type, newDocs);
            setTemplates(result);
            setEditingTemplate(null);
        } catch (error) {
            console.error('Failed to update template:', error);
            setUpdateError('Failed to update template. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [editingTemplate]);

    const handleEditClick = useCallback((category: 'entity' | 'individual' | 'risk', type: string, documents: TemplateDoc[]) => {
        setEditingTemplate({ category, type, documents });
    }, []);

    return (
        <>
            <EditTemplateModal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                templateData={editingTemplate}
                onSave={handleSaveTemplate}
                isUpdating={isUpdating}
            />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Template Manager</h1>
                    <button onClick={refreshTemplates} disabled={isRefreshing} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50" title="Refresh templates">
                        <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {updateError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{updateError}</p>
                        </div>
                    </div>
                )}

                <AccordionPanel title="Entity Templates" defaultOpen={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* ✅ FIX: Explicitly cast 'value' to the correct type */}
                        {Object.entries(templates.entityTemplates).map(([key, value]) => (
                            <TemplateCard key={key} title={key} documents={value as TemplateDoc[]} onEdit={() => handleEditClick('entity', key, value as TemplateDoc[])} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Individual Templates" defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* ✅ FIX: Explicitly cast 'value' to the correct type */}
                        {Object.entries(templates.individualTemplates).map(([key, value]) => (
                            <TemplateCard key={key} title={key} documents={value as TemplateDoc[]} onEdit={() => handleEditClick('individual', key, value as TemplateDoc[])} />
                        ))}
                    </div>
                </AccordionPanel>

                {/* ✅ REMOVED: The obsolete Bank Form Templates section */}

                <AccordionPanel title="Risk Based Documents" defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {/* ✅ FIX: Explicitly cast 'value' to the correct type */}
                        {Object.entries(templates.riskBasedDocuments).map(([key, value]) => (
                            <TemplateCard key={key} title={`${key} Risk`} documents={value as TemplateDoc[]} onEdit={() => handleEditClick('risk', key, value as TemplateDoc[])} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Entity Role Mapping" defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* This part works with string[], so no cast is needed */}
                        {Object.entries(templates.entityRoleMapping).map(([key, value]) => (
                            <ListCard key={key} title={key} items={value} />
                        ))}
                    </div>
                </AccordionPanel>
            </div>
        </>
    );
}