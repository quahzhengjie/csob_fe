// =================================================================================
// FILE: src/features/admin/components/EditTemplateModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle, ChevronDown, ChevronUp, FileText, Building, ClipboardList } from 'lucide-react';
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

interface CategorySection {
    category: 'CUSTOMER' | 'BANK_MANDATORY' | 'BANK_NON_MANDATORY';
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    documents: (TemplateDoc & { tempId?: string })[];
}

export default function EditTemplateModal({ 
    isOpen, 
    onClose, 
    templateData, 
    onSave, 
    isUpdating 
}: EditTemplateModalProps) {
    const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['CUSTOMER', 'BANK_MANDATORY', 'BANK_NON_MANDATORY']));
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize category sections when modal opens
    useEffect(() => {
        if (templateData && templateData.documents) {
            const sections: CategorySection[] = [
                {
                    category: 'CUSTOMER',
                    label: 'Mandatory from Customer',
                    description: 'Documents that must be provided by the customer',
                    icon: <FileText className="w-5 h-5" />,
                    color: 'blue',
                    documents: []
                },
                {
                    category: 'BANK_MANDATORY',
                    label: 'Mandatory Bank Documents',
                    description: 'Bank forms that must be completed',
                    icon: <Building className="w-5 h-5" />,
                    color: 'purple',
                    documents: []
                },
                {
                    category: 'BANK_NON_MANDATORY',
                    label: 'Non-Mandatory Documents',
                    description: 'Optional documents that may be required in special cases',
                    icon: <ClipboardList className="w-5 h-5" />,
                    color: 'gray',
                    documents: []
                }
            ];

            // Group existing documents by category
            templateData.documents.forEach(doc => {
                const category = doc.category || 'CUSTOMER';
                const section = sections.find(s => s.category === category);
                if (section) {
                    section.documents.push({ ...doc, tempId: Math.random().toString() });
                }
            });

            setCategorySections(sections);
            setErrors({});
        }
    }, [templateData]);

    if (!isOpen || !templateData) return null;

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const handleAddDocument = (categoryIndex: number) => {
        const newSections = [...categorySections];
        const newDoc: TemplateDoc & { tempId: string } = {
            name: '',
            required: true,
            description: undefined,
            validityMonths: undefined,
            category: newSections[categoryIndex].category,
            tempId: Math.random().toString()
        };
        newSections[categoryIndex].documents.push(newDoc);
        setCategorySections(newSections);
    };

    const handleRemoveDocument = (categoryIndex: number, docIndex: number) => {
        const newSections = [...categorySections];
        const doc = newSections[categoryIndex].documents[docIndex];
        newSections[categoryIndex].documents.splice(docIndex, 1);
        setCategorySections(newSections);
        
        // Clear error for this document
        const errorKey = `${categoryIndex}-${doc.tempId}`;
        const newErrors = { ...errors };
        delete newErrors[errorKey];
        setErrors(newErrors);
    };

    const handleUpdateDocument = (categoryIndex: number, docIndex: number, field: keyof TemplateDoc, value: string | boolean | number | undefined) => {
        const newSections = [...categorySections];
        newSections[categoryIndex].documents[docIndex] = {
            ...newSections[categoryIndex].documents[docIndex],
            [field]: value
        };
        setCategorySections(newSections);
        
        // Clear error if name is provided
        if (field === 'name' && value) {
            const doc = newSections[categoryIndex].documents[docIndex];
            const errorKey = `${categoryIndex}-${doc.tempId}`;
            const newErrors = { ...errors };
            delete newErrors[errorKey];
            setErrors(newErrors);
        }
    };

    const validateDocuments = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        categorySections.forEach((section, categoryIndex) => {
            section.documents.forEach((doc) => {
                if (!doc.name || !doc.name.trim()) {
                    const errorKey = `${categoryIndex}-${doc.tempId}`;
                    newErrors[errorKey] = 'Document name is required';
                    isValid = false;
                }
            });
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        if (!validateDocuments()) return;

        // Flatten all documents from all categories
        const allDocuments = categorySections.flatMap(section => 
            section.documents.map(doc => ({
                name: doc.name.trim(),
                required: doc.required !== false,
                description: doc.description?.trim() || undefined,
                validityMonths: doc.validityMonths || undefined,
                category: doc.category
            }))
        );

        if (allDocuments.length === 0) {
            const confirmEmpty = window.confirm(
                'Are you sure you want to remove all documents from this template? This will clear all document requirements.'
            );
            if (!confirmEmpty) return;
        }

        setIsSaving(true);
        try {
            await onSave(templateData.type, allDocuments);
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getTotalDocumentCount = () => {
        return categorySections.reduce((total, section) => total + section.documents.length, 0);
    };

    const getColorClasses = (color: string) => {
        const colorMap = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
            gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        };
        return colorMap[color as keyof typeof colorMap] || colorMap.gray;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Edit Template: {templateData.type}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Total documents: {getTotalDocumentCount()}
                            </p>
                        </div>
                        <button 
                            onClick={onClose} 
                            disabled={isSaving || isUpdating}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {categorySections.map((section, categoryIndex) => (
                            <div key={section.category} className={`rounded-lg border ${getColorClasses(section.color)}`}>
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(section.category)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-800`}>
                                            {section.icon}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {section.label}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {section.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {section.documents.length} document{section.documents.length !== 1 ? 's' : ''}
                                        </span>
                                        {expandedCategories.has(section.category) ? <ChevronUp /> : <ChevronDown />}
                                    </div>
                                </button>

                                {/* Category Documents */}
                                {expandedCategories.has(section.category) && (
                                    <div className="p-4 pt-0 space-y-3">
                                        {section.documents.map((doc, docIndex) => {
                                            const errorKey = `${categoryIndex}-${doc.tempId}`;
                                            return (
                                                <div key={doc.tempId} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Document Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={doc.name}
                                                                onChange={(e) => handleUpdateDocument(categoryIndex, docIndex, 'name', e.target.value)}
                                                                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                                                                    errors[errorKey] ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-slate-600'
                                                                }`}
                                                                placeholder="e.g., Certificate of Incorporation"
                                                            />
                                                            {errors[errorKey] && (
                                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                                    {errors[errorKey]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Validity Period (months)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={doc.validityMonths || ''}
                                                                onChange={(e) => handleUpdateDocument(categoryIndex, docIndex, 'validityMonths', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                                                placeholder="e.g., 12"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={doc.description || ''}
                                                            onChange={(e) => handleUpdateDocument(categoryIndex, docIndex, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                                            placeholder="Brief description of this document requirement"
                                                            rows={2}
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={doc.required !== false}
                                                                onChange={(e) => handleUpdateDocument(categoryIndex, docIndex, 'required', e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Required Document
                                                            </span>
                                                        </label>
                                                        
                                                        <button
                                                            onClick={() => handleRemoveDocument(categoryIndex, docIndex)}
                                                            disabled={isSaving || isUpdating}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Remove document"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button
                                            onClick={() => handleAddDocument(categoryIndex)}
                                            disabled={isSaving || isUpdating}
                                            className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                                        >
                                            <Plus size={20} />
                                            <span className="font-medium">Add Document to {section.label}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getTotalDocumentCount() === 0 && (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={16} />
                                <span>Warning: Saving with no documents will clear all requirements</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            disabled={isSaving || isUpdating}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || isUpdating}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
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
    );
}