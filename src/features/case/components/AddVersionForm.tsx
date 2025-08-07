// =================================================================================
// FILE: src/features/case/components/AddVersionForm.tsx
// =================================================================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Scan, FileText, Image, Check, AlertCircle, X, Plus, File } from 'lucide-react';
import type { ScannerProfile } from '@/types/entities';

// Define the scan response type
interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface AddVersionFormProps {
    onUpload: (details: { expiryDate: string; comments: string; file?: File }) => void;
    onScan: (details: { expiryDate: string; comments: string; scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
    onCancel: () => void;
    scannerProfiles: ScannerProfile[];
}

type ScanState = 'idle' | 'scanning' | 'scanned' | 'error';

export function AddVersionForm({ onUpload, onScan, onCancel, scannerProfiles }: AddVersionFormProps) {
    const [activeMode, setActiveMode] = useState<'upload' | 'scan'>('upload');
    const [uploadDetails, setUploadDetails] = useState({ expiryDate: '', comments: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [scanFormat, setScanFormat] = useState<'pdf' | 'png'>('pdf');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scannedDocumentId, setScannedDocumentId] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    
    // Initialize with empty string and update when profiles are available
    const [selectedScanner, setSelectedScanner] = useState<string>('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Add debug logging for every render
    console.log('🔄 AddVersionForm RENDER:', {
        scannerProfilesLength: scannerProfiles.length,
        selectedScanner,
        scannerProfiles: scannerProfiles.map(s => ({ id: s.id, name: s.name }))
    });

    // Update selected scanner when profiles change or on first load
    useEffect(() => {
        console.log('🔄 useEffect triggered - Scanner profiles updated:', scannerProfiles);
        console.log('🔄 Current selectedScanner state:', selectedScanner);
        
        // ONLY set the initial scanner if we don't have one selected yet AND profiles are available
        if (scannerProfiles.length > 0 && selectedScanner === '') {
            console.log('✅ Setting initial scanner to:', scannerProfiles[0].id, scannerProfiles[0].name);
            setSelectedScanner(scannerProfiles[0].id.toString());
        } else if (selectedScanner !== '') {
            // Verify the currently selected scanner still exists in the profiles
            const currentScanner = scannerProfiles.find(s => s.id.toString() === selectedScanner.toString());
            if (!currentScanner && scannerProfiles.length > 0) {
                console.log('⚠️ Previously selected scanner not found, resetting to first available');
                setSelectedScanner(scannerProfiles[0].id.toString());
            } else if (currentScanner) {
                console.log('✅ Current scanner selection is valid:', currentScanner.name);
            }
        }
    }, [scannerProfiles, selectedScanner]);

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const validateFile = (file: File) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            // PDFs
            'application/pdf',
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff',
            // Microsoft Office
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            // Other common formats
            'text/plain', // .txt
            'text/csv', // .csv
            'application/rtf', // .rtf
        ];
        
        if (file.size > maxSize) {
            alert('File size must be less than 10MB');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a supported file type:\n• PDF\n• Images (JPG, PNG, GIF, BMP, TIFF)\n• Microsoft Office (DOC, DOCX, XLS, XLSX, PPT, PPTX)\n• Text files (TXT, CSV, RTF)');
            return false;
        }
        
        return true;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (file: File) => {
        if (file.type === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
        // eslint-disable-next-line jsx-a11y/alt-text
        if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
        if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-8 w-8 text-blue-600" />;
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return <FileText className="h-8 w-8 text-green-600" />;
        if (file.type.includes('powerpoint') || file.type.includes('presentation')) return <FileText className="h-8 w-8 text-orange-600" />;
        if (file.type === 'text/plain' || file.type === 'text/csv') return <FileText className="h-8 w-8 text-gray-600" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const handleSaveUpload = () => {
        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }
        
        console.log('Saving upload with file:', selectedFile.name);
        
        onUpload({
            ...uploadDetails,
            file: selectedFile
        });
        onCancel();
    };

    // This function triggers the scan immediately and saves to DB
    const handleTriggerScan = async () => {
        console.log('=== SCAN BUTTON CLICKED ===');
        console.log('🔥 QUICK DEBUG - Selected Scanner ID:', selectedScanner);
        console.log('🔥 QUICK DEBUG - Available scanners:', scannerProfiles.map(s => ({id: s.id, name: s.name})));
        
        if (!selectedScanner) {
            alert('Please select a scanner profile');
            return;
        }

        // Fix: Convert both to strings for comparison since HTML select values are always strings
        const scanner = scannerProfiles.find(s => s.id.toString() === selectedScanner.toString());
        console.log('🔍 SCANNER LOOKUP:');
        console.log('- Looking for ID:', selectedScanner);
        console.log('- Found scanner object:', scanner);
        console.log('- Scanner name should be:', scanner?.name);
        console.log('- All available scanners:', scannerProfiles.map(s => ({ id: s.id, name: s.name })));
        
        if (!scanner) {
            alert('Invalid scanner selected');
            return;
        }

        // Double-check the scanner name before proceeding
        console.log('⚠️  CRITICAL CHECK:');
        console.log('- scanner.name =', scanner.name);
        console.log('- scanner.id =', scanner.id);
        console.log('- selectedScanner state =', selectedScanner);

        setScanState('scanning');
        
        try {
            // Create scan details with the CORRECT structure that matches backend expectations
            const scanDetails = {
                // Primary profile identification - ensure this is the scanner name, not "Default Scanner"
                profile: scanner.name, // Backend expects 'profile' field with scanner name
                profileId: scanner.id,
                profileName: scanner.name, // Keep this for redundancy
                
                // Scanner settings
                resolution: scanner.resolution,
                colorMode: scanner.colorMode,
                source: scanner.source,
                format: scanFormat,
                
                // Timestamp
                scannedAt: new Date().toISOString(),
                
                // Metadata (will be updated later if user provides)
                expiryDate: uploadDetails.expiryDate || '',
                comments: uploadDetails.comments || ''
            };

            console.log('=== SCAN DETAILS PREPARED ===');
            console.log('🎯 Profile field value:', scanDetails.profile);
            console.log('🎯 ProfileName field value:', scanDetails.profileName);
            console.log('📋 Full scan details object:', JSON.stringify(scanDetails, null, 2));

            // Pass the scan details with expiry date and comments
            const result = await onScan({
                expiryDate: uploadDetails.expiryDate,
                comments: uploadDetails.comments,
                scanDetails
            });
            
            console.log('=== SCAN RESULT ===');
            console.log('Scan completed successfully:', result);
            
            // The scan was triggered successfully
            setScanState('scanned');
            setScannedDocumentId(result?.documentId || 'DOC-' + Date.now());
            
        } catch (error) {
            console.error('=== SCAN ERROR ===');
            console.error('Scan error details:', error);
            setScanState('error');
        }
    };

    const resetScan = () => {
        setScanState('idle');
        setScannedDocumentId(null);
        setUploadDetails({ expiryDate: '', comments: '' });
    };

    return (
        <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-lg">
            {/* Header with Mode Toggle */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Version</h3>
                    <button
                        onClick={onCancel}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setActiveMode('upload')}
                        disabled={scanState === 'scanning'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeMode === 'upload' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Upload size={16} /> Upload File
                    </button>
                    <button
                        onClick={() => setActiveMode('scan')}
                        disabled={scanState === 'scanning'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeMode === 'scan' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Scan size={16} /> Scan Document
                    </button>
                </div>
            </div>

            <div className="p-6">
                {activeMode === 'upload' ? (
                    <div className="space-y-6">
                        {/* Drag and Drop Upload Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Select or Drop File
                            </label>
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                    dragActive
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : selectedFile
                                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
                                />
                                
                                {selectedFile ? (
                                    <div className="space-y-3">
                                        {getFileIcon(selectedFile)}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                        >
                                            <X size={12} /> Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center">
                                            <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                <Plus size={24} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                PDF, Images, Office documents, Text files up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Expiry Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={uploadDetails.expiryDate}
                                    onChange={(e) => setUploadDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                                             bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={uploadDetails.comments}
                                    onChange={(e) => setUploadDetails(prev => ({ ...prev, comments: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                                             bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Add any notes about this document..."
                                />
                            </div>
                        </div>

                        {/* Upload Button */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                         bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600
                                         transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUpload}
                                disabled={!selectedFile}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                                         hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                                         flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Upload size={16} />
                                Upload Document
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {scanState === 'idle' && (
                            <>
                                {/* Scanner Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Scanner Profile
                                        </label>
                                        <select
                                            value={selectedScanner}
                                            onChange={(e) => {
                                                const newScannerId = e.target.value;
                                                const newScanner = scannerProfiles.find(s => s.id.toString() === newScannerId);
                                                
                                                console.log('🔄 SCANNER SELECTION CHANGED:');
                                                console.log('- New selected ID:', newScannerId);
                                                console.log('- New scanner object:', newScanner);
                                                console.log('- New scanner name:', newScanner?.name);
                                                console.log('- Previous selected ID was:', selectedScanner);
                                                
                                                setSelectedScanner(newScannerId);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                                                     bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        >
                                            {scannerProfiles.map(profile => (
                                                <option key={profile.id} value={profile.id}>
                                                    {profile.name} ({profile.source} - {profile.colorMode})
                                                </option>
                                            ))}
                                        </select>
                                        {selectedScanner && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Selected: {scannerProfiles.find(s => s.id.toString() === selectedScanner.toString())?.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Output Format
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                                <input
                                                    type="radio"
                                                    value="pdf"
                                                    checked={scanFormat === 'pdf'}
                                                    onChange={(e) => setScanFormat(e.target.value as 'pdf')}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <FileText size={16} className="text-red-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                                <input
                                                    type="radio"
                                                    value="png"
                                                    checked={scanFormat === 'png'}
                                                    onChange={(e) => setScanFormat(e.target.value as 'png')}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <Image size={16} className="text-blue-500" aria-hidden="true"/>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PNG</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Fields for Scan */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Expiry Date (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={uploadDetails.expiryDate}
                                            onChange={(e) => setUploadDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                                                     bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Comments (Optional)
                                        </label>
                                        <textarea
                                            value={uploadDetails.comments}
                                            onChange={(e) => setUploadDetails(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                                                     bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Add any notes about this document..."
                                        />
                                    </div>
                                </div>

                                {/* Scan Button */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={onCancel}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                                 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600
                                                 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTriggerScan}
                                        disabled={!selectedScanner || scannerProfiles.length === 0}
                                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg 
                                                 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                                                 flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Scan size={16} />
                                        {scannerProfiles.length === 0 ? 'Loading scanners...' : 'Scan & Save Document'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        This will immediately scan and save the document with the provided details
                                    </p>
                                </div>
                            </>
                        )}

                        {scanState === 'scanning' && (
                            <div className="text-center py-12">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
                                    <Scan className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Scanning Document
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Please wait while the scanner processes your document...
                                </p>
                            </div>
                        )}

                        {scanState === 'scanned' && (
                            <div className="text-center py-12">
                                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
                                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Document Scanned Successfully!
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Document ID: {scannedDocumentId}
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={resetScan}
                                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 
                                                 bg-blue-50 dark:bg-blue-900/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900
                                                 transition-colors"
                                    >
                                        Scan Another
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg 
                                                 hover:bg-green-700 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}

                        {scanState === 'error' && (
                            <div className="text-center py-12">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Scan Failed
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Please check if the scanner is connected and try again.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={resetScan}
                                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 
                                                 bg-red-50 dark:bg-red-900/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900
                                                 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                                 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600
                                                 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}