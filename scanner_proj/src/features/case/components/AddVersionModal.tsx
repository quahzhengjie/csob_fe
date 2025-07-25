
// =================================================================================
// FILE: src/features/case/components/AddVersionModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { Upload, Scan, X } from 'lucide-react';
import type { ChecklistDocument } from '../utils/checklist';
import type { ScannerProfile } from '@/types/entities';

interface AddVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: ChecklistDocument | null;
    scannerProfiles: ScannerProfile[];
    onSave: (details: { expiryDate: string, comments: string, scanDetails?: Record<string, string> }) => void;
}

export function AddVersionModal({ isOpen, onClose, document, scannerProfiles, onSave }: AddVersionModalProps) {
    const [mode, setMode] = useState('upload'); // 'upload' or 'scan'
    const [uploadDetails, setUploadDetails] = useState({ expiryDate: '', comments: '' });
    const [selectedProfileId, setSelectedProfileId] = useState(scannerProfiles[0]?.id || '');

    if (!isOpen || !document) return null;

    const handleSave = () => {
        const finalDetails: { expiryDate: string, comments: string, scanDetails?: Record<string, string> } = { ...uploadDetails };
        if (mode === 'scan') {
            const profile = scannerProfiles.find(p => p.id === selectedProfileId);
            finalDetails.scanDetails = {
                profileName: profile?.name || 'Unknown',
                resolution: profile?.resolution || 'N/A',
                colorMode: profile?.colorMode || 'N/A',
            };
        }
        onSave(finalDetails);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="p-6 rounded-xl border w-full max-w-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add: {document.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
                </div>

                <div className="border-b mb-4">
                    <div className="flex -mb-px">
                        <button onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-medium border-b-2 ${mode === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <Upload size={14} className="inline-block mr-2" />Upload File
                        </button>
                        <button onClick={() => setMode('scan')} className={`px-4 py-2 text-sm font-medium border-b-2 ${mode === 'scan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <Scan size={14} className="inline-block mr-2" />Scan Document
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {mode === 'scan' && (
                         <div>
                            <label className="block text-sm font-medium mb-1">Scanner Profile</label>
                            <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600">
                                {scannerProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="p-6 rounded-lg text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
                        {mode === 'upload' ? <Upload className="mx-auto h-10 w-10 text-gray-400 dark:text-slate-500" /> : <Scan className="mx-auto h-10 w-10 text-gray-400 dark:text-slate-500" />}
                        <p className="mt-2 text-sm font-medium">{mode === 'upload' ? 'Click or drag file to upload' : 'Click button below to start scan'}</p>
                        <p className="text-xs text-gray-500">(Mock interface)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                        <input type="date" value={uploadDetails.expiryDate} onChange={e => setUploadDetails({...uploadDetails, expiryDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Comments (Optional)</label>
                        <textarea rows={2} value={uploadDetails.comments} onChange={e => setUploadDetails({...uploadDetails, comments: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">
                        {mode === 'upload' ? 'Save Upload' : 'Save Scan'}
                    </button>
                </div>
            </div>
        </div>
    );
};