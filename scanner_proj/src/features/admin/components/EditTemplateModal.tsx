// =================================================================================
// FILE: src/features/admin/components/EditTemplateModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { TemplateDoc } from '@/types/entities';

interface EditTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateData: {
        category: 'entity' | 'individual' | 'risk';
        type: string;
        documents: TemplateDoc[];
    } | null;
    onSave: (type: string, documents: TemplateDoc[]) => Promise<void>;
    isUpdating?: boolean;
}

export default function EditTemplateModal({ isOpen, onClose, templateData, onSave, isUpdating }: EditTemplateModalProps) {
    const [documents, setDocuments] = useState<TemplateDoc[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (templateData) {
            setDocuments([...templateData.documents]);
        }
    }, [templateData]);

    if (!isOpen || !templateData) return null;

    const handleAddDocument = () => {
        setDocuments([...documents, { name: '', required: true }]);
    };

    const handleRemoveDocument = (index: number) => {
        setDocuments(documents.filter((_, i) => i !== index));
    };

    const handleUpdateDocument = <K extends keyof TemplateDoc>(
        index: number, 
        field: K, 
        value: TemplateDoc[K]
    ) => {
        const updated = [...documents];
        updated[index] = { ...updated[index], [field]: value };
        setDocuments(updated);
    };

    const handleSave = async () => {
        // Validate all documents have names
        const hasEmptyNames = documents.some(doc => !doc.name.trim());
        if (hasEmptyNames) {
            alert('All documents must have a name');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(templateData.type, documents);
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getCategoryLabel = () => {
        switch (templateData.category) {
            case 'entity': return 'Entity Template';
            case 'individual': return 'Individual Template';
            case 'risk': return 'Risk-Based Documents';
            default: return 'Template';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Edit {getCategoryLabel()}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {templateData.type}
                            </p>
                        </div>
                        <button 
                            onClick={onClose} 
                            disabled={isSaving || isUpdating}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {documents.map((doc, index) => (
                            <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Document Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={doc.name}
                                            onChange={(e) => handleUpdateDocument(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Certificate of Incorporation"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Validity Period (months)
                                        </label>
                                        <input
                                            type="number"
                                            value={doc.validityMonths || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                handleUpdateDocument(index, 'validityMonths', value ? parseInt(value) : undefined);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 12"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={doc.description || ''}
                                        onChange={(e) => handleUpdateDocument(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                        placeholder="Brief description of this document requirement"
                                        rows={2}
                                    />
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={doc.required !== false}
                                            onChange={(e) => handleUpdateDocument(index, 'required', e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Required Document
                                        </span>
                                    </label>
                                    
                                    <button
                                        onClick={() => handleRemoveDocument(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                        title="Remove document"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddDocument}
                            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            <Plus size={20} />
                            <span className="font-medium">Add Document</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {documents.length} document{documents.length !== 1 ? 's' : ''} configured
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isSaving || isUpdating}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isUpdating}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {(isSaving || isUpdating) ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}