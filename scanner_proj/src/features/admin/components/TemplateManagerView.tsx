// =================================================================================
// FILE: src/features/admin/components/TemplateManagerView.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { ChevronRight, Edit, AlertCircle } from 'lucide-react';
import { updateDocumentRequirements } from '@/lib/apiClient';
import EditTemplateModal from './EditTemplateModal';
import type { TemplateDoc, DocumentRequirements } from '@/types/entities';

interface TemplateManagerViewProps {
    initialTemplates: DocumentRequirements;
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
            <button 
                onClick={onEdit} 
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                title="Edit template"
            >
                <Edit size={16}/>
            </button>
        </div>
        <div className="flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {documents.length === 0 ? (
                <p className="italic text-slate-500">No documents configured</p>
            ) : (
                documents.map((doc, i) => (
                    <div key={i}>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                            • {doc.name} {doc.required && <span className="text-red-500">*</span>}
                        </p>
                        {doc.description && <p className="pl-4 text-xs italic">{doc.description}</p>}
                        {doc.validityMonths && (
                            <p className="pl-4 text-xs font-mono text-blue-600 dark:text-blue-400">
                                Valid for {doc.validityMonths} months
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
);

// A self-contained, collapsible panel for each template category
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
    const [editingTemplate, setEditingTemplate] = useState<{ 
        category: 'entity' | 'individual' | 'risk'; 
        type: string; 
        documents: TemplateDoc[] 
    } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const handleSaveTemplate = async (type: string, newDocs: TemplateDoc[]) => {
        if (!editingTemplate) return;
        
        setIsUpdating(true);
        setUpdateError(null);
        
        try {
            // Create a copy of the current templates
            const updatedTemplates = { ...templates };
            
            // Update the appropriate section
            if (editingTemplate.category === 'entity') {
                updatedTemplates.entityTemplates = {
                    ...updatedTemplates.entityTemplates,
                    [type]: newDocs
                };
            } else if (editingTemplate.category === 'individual') {
                updatedTemplates.individualTemplates = {
                    ...updatedTemplates.individualTemplates,
                    [type]: newDocs
                };
            } else if (editingTemplate.category === 'risk') {
                updatedTemplates.riskBasedDocuments = {
                    ...updatedTemplates.riskBasedDocuments,
                    [type]: newDocs
                };
            }
            
            // Call the API to update
            const result = await updateDocumentRequirements(updatedTemplates);
            if (result) {
                setTemplates(result);
                setEditingTemplate(null);
            }
        } catch (error) {
            console.error('Failed to update template:', error);
            setUpdateError('Failed to update template. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };
    
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
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Manage document requirements for different entity types and scenarios
                    </div>
                </div>

                {updateError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-700 dark:text-red-300">{updateError}</p>
                            </div>
                        </div>
                    </div>
                )}

                <AccordionPanel title="Entity Templates" defaultOpen={true}>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Document requirements based on entity type (Company, Partnership, Trust)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.entityTemplates).map(([key, value]) => (
                            <TemplateCard 
                                key={key} 
                                title={key} 
                                documents={value} 
                                onEdit={() => setEditingTemplate({ 
                                    category: 'entity', 
                                    type: key, 
                                    documents: value 
                                })} 
                            />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Individual Templates" defaultOpen={false}>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Document requirements based on individual residency status
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.individualTemplates).map(([key, value]) => (
                            <TemplateCard 
                                key={key} 
                                title={key} 
                                documents={value} 
                                onEdit={() => setEditingTemplate({ 
                                    category: 'individual', 
                                    type: key, 
                                    documents: value 
                                })} 
                            />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Bank Form Templates" defaultOpen={false}>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Standard bank forms required for different scenarios
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.bankFormTemplates).map(([key, value]) => (
                            <ListCard key={key} title={key} items={value} />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Risk Based Documents" defaultOpen={false}>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Additional documents required based on risk level
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(templates.riskBasedDocuments).map(([key, value]) => (
                            <TemplateCard 
                                key={key} 
                                title={`${key} Risk`} 
                                documents={value} 
                                onEdit={() => setEditingTemplate({ 
                                    category: 'risk', 
                                    type: key, 
                                    documents: value 
                                })} 
                            />
                        ))}
                    </div>
                </AccordionPanel>

                <AccordionPanel title="Entity Role Mapping" defaultOpen={false}>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Roles associated with each entity type
                    </p>
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