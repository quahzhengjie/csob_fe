// =================================================================================
// FILE: src/features/admin/components/EditTemplateModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { TemplateDoc } from '@/types/entities';

interface EditTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entityType: string, documents: TemplateDoc[]) => void;
    templateData: { type: string, documents: TemplateDoc[] } | null;
}

export default function EditTemplateModal({ isOpen, onClose, onSave, templateData }: EditTemplateModalProps) {
    const [docs, setDocs] = useState<TemplateDoc[]>([]);
    
    // UPDATED: State for the new document form now includes all fields
    const [newDoc, setNewDoc] = useState({ name: '', description: '', validityMonths: '' });

    useEffect(() => {
        if (templateData) {
            setDocs(templateData.documents);
        }
    }, [templateData]);

    if (!isOpen || !templateData) return null;

    const handleAddDoc = () => {
        if (newDoc.name.trim()) {
            setDocs([...docs, {
                name: newDoc.name.trim(),
                description: newDoc.description.trim(),
                validityMonths: newDoc.validityMonths ? parseInt(newDoc.validityMonths, 10) : undefined,
                required: true,
            }]);
            setNewDoc({ name: '', description: '', validityMonths: '' }); // Reset form
        }
    };

    const handleRemoveDoc = (index: number) => {
        setDocs(docs.filter((_, i) => i !== index));
    };

    const handleSaveChanges = () => {
        onSave(templateData.type, docs);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="p-6 rounded-xl border w-full max-w-2xl bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold">Edit Template: {templateData.type}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {docs.map((doc, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{doc.name}</p>
                                <button onClick={() => handleRemoveDoc(index)} className="p-1.5 text-red-500 rounded-md hover:bg-red-500/10"><Trash2 size={16}/></button>
                            </div>
                            {doc.description && <p className="text-xs text-slate-500 mt-1">{doc.description}</p>}
                            {doc.validityMonths && <p className="text-xs font-mono mt-1 text-blue-600 dark:text-blue-400">Requires {doc.validityMonths}-month validity</p>}
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    <p className="font-semibold text-sm">Add New Document Requirement</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={newDoc.name} onChange={(e) => setNewDoc({...newDoc, name: e.target.value})} placeholder="Document name" className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" />
                        <input type="number" value={newDoc.validityMonths} onChange={(e) => setNewDoc({...newDoc, validityMonths: e.target.value})} placeholder="Required validity (months)" className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <textarea value={newDoc.description} onChange={(e) => setNewDoc({...newDoc, description: e.target.value})} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" />
                    <div className="flex justify-end">
                        <button onClick={handleAddDoc} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Add</button>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-gray-200 dark:bg-slate-600">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500">Save Changes</button>
                </div>
            </div>
        </div>
    );
}