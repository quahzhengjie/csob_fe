// =================================================================================
// FILE: src/features/case/components/AddVersionForm.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { Upload, Scan, RefreshCw } from 'lucide-react';
import type { ScannerProfile } from '@/types/entities';

interface AddVersionFormProps {
  onUpload: (details: { expiryDate: string, comments: string }) => void;
  onScan: (details: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => void;
  onCancel: () => void;
  scannerProfiles: ScannerProfile[];
}

export function AddVersionForm({ onUpload, onScan, onCancel, scannerProfiles }: AddVersionFormProps) {
    const [mode, setMode] = useState<'upload' | 'scan'>('upload');
    const [uploadDetails, setUploadDetails] = useState({ expiryDate: '', comments: '' });
    const [scanDetails, setScanDetails] = useState({ expiryDate: '', comments: '' });
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');

    const handleStartScan = () => {
        setScanStatus('scanning');
        setTimeout(() => setScanStatus('complete'), 1500);
    };

    const handleSaveScan = () => {
        onScan({
            ...scanDetails,
            scanDetails: { profile: scannerProfiles[0]?.name || 'Default Scanner' }
        });
        onCancel();
    };

    return (
        <div className="p-4 rounded-b-lg space-y-4 border-t bg-slate-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
            <div className="flex border-b border-gray-200 dark:border-slate-600">
                <button onClick={() => setMode('upload')} className={`flex-1 p-2 text-sm font-medium ${mode === 'upload' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                    <Upload size={14} className="inline-block mr-2" />Upload File
                </button>
                <button onClick={() => setMode('scan')} className={`flex-1 p-2 text-sm font-medium ${mode === 'scan' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                    <Scan size={14} className="inline-block mr-2" />Scan Document
                </button>
            </div>

            {mode === 'upload' && (
                <div className="space-y-3">
                    <div className="p-4 rounded-lg text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-slate-500" />
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Click or drag file to upload</p>
                        <p className="text-xs text-gray-500">(Mock interface)</p>
                    </div>
                     <div><label className="text-xs text-slate-500">Expiry Date (Optional)</label><input type="date" value={uploadDetails.expiryDate} onChange={e => setUploadDetails({...uploadDetails, expiryDate: e.target.value})} className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" /></div>
                     <div><label className="text-xs text-slate-500">Comments (Optional)</label><textarea rows={2} value={uploadDetails.comments} onChange={e => setUploadDetails({...uploadDetails, comments: e.target.value})} className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div className="flex justify-end gap-2">
                        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</button>
                        <button onClick={() => onUpload(uploadDetails)} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Save Upload</button>
                    </div>
                </div>
            )}
            {mode === 'scan' && (
                 <div className="space-y-4">
                    {scanStatus !== 'complete' ? (
                        <>
                           <div><label className="text-xs text-slate-500">Scanner Profile</label><select className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600">{scannerProfiles.map(p => <option key={p.id}>{p.name}</option>)}</select></div>
                           <div className="flex justify-end gap-2 pt-2">
                               <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</button>
                               <button onClick={handleStartScan} disabled={scanStatus === 'scanning'} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2">
                                   {scanStatus === 'scanning' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                                   {scanStatus === 'scanning' ? 'Scanning...' : 'Start Scan'}
                               </button>
                           </div>
                        </>
                    ) : (
                         <div className="space-y-3">
                            <div className="p-3 text-center bg-green-100 dark:bg-green-900/30 rounded-lg"><p className="font-semibold text-green-700 dark:text-green-300">✓ Scan Complete. Add details below.</p></div>
                             <div><label className="text-xs text-slate-500">Expiry Date (Optional)</label><input type="date" value={scanDetails.expiryDate} onChange={e => setScanDetails({...scanDetails, expiryDate: e.target.value})} className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" /></div>
                             <div><label className="text-xs text-slate-500">Comments (Optional)</label><textarea rows={2} value={scanDetails.comments} onChange={e => setScanDetails({...scanDetails, comments: e.target.value})} className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600" /></div>
                             <div className="flex justify-end gap-2">
                                <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</button>
                                 <button onClick={handleSaveScan} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Save Scanned Document</button>
                             </div>
                         </div>
                    )}
                 </div>
            )}
        </div>
    );
}