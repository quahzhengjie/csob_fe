// // =================================================================================
// // FILE: src/features/case/components/CallReportModal.tsx - Updated with timezone handling
// // =================================================================================
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { X, Phone, Clock, Calendar, FileText, User } from 'lucide-react';
// import type { CallReport } from '@/types/entities';
// import { formatDateForInput, formatTimeForInput, combineDateTime } from '@/lib/dateUtils';

// interface CallReportModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (reportData: Omit<CallReport, 'reportId'>) => void;
//   initialData?: CallReport | null;
// }

// type ReportFormData = {
//   callDate: string;      // Local date (YYYY-MM-DD)
//   callTime: string;      // Local time (HH:MM)
//   summary: string;
//   nextSteps: string;
//   callType?: 'Inbound' | 'Outbound' | 'Meeting' | 'Email';
//   duration?: number;
//   outcome?: 'Positive' | 'Neutral' | 'Negative' | 'Follow-up Required';
//   attendees: string[];
// };

// export function CallReportModal({ isOpen, onClose, onSave, initialData }: CallReportModalProps) {
//   const [reportData, setReportData] = useState<ReportFormData>({
//     callDate: new Date().toISOString().split('T')[0],
//     callTime: new Date().toTimeString().slice(0, 5),
//     summary: '',
//     nextSteps: '',
//     callType: 'Outbound',
//     duration: undefined,
//     outcome: 'Neutral',
//     attendees: [],
//   });

//   const [newAttendee, setNewAttendee] = useState('');
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   useEffect(() => {
//     if (isOpen) {
//       if (initialData) {
//         // Editing mode - convert UTC to local date/time
//         setReportData({
//           callDate: formatDateForInput(initialData.callDate),
//           callTime: formatTimeForInput(initialData.callDate),
//           summary: initialData.summary,
//           nextSteps: initialData.nextSteps || '',
//           callType: initialData.callType || 'Outbound',
//           duration: initialData.duration,
//           outcome: initialData.outcome || 'Neutral',
//           attendees: initialData.attendees || [],
//         });
//       } else {
//         // Create mode - use current local date/time
//         const now = new Date();
//         setReportData({
//           callDate: now.toISOString().split('T')[0],
//           callTime: now.toTimeString().slice(0, 5),
//           summary: '',
//           nextSteps: '',
//           callType: 'Outbound',
//           duration: undefined,
//           outcome: 'Neutral',
//           attendees: [],
//         });
//       }
//       setErrors({});
//       setNewAttendee('');
//     }
//   }, [isOpen, initialData]);

//   if (!isOpen) return null;

//   const handleChange = <K extends keyof ReportFormData>(
//     field: K,
//     value: ReportFormData[K]
//   ) => {
//     setReportData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handleAddAttendee = () => {
//     if (newAttendee.trim()) {
//       setReportData(prev => ({
//         ...prev,
//         attendees: [...prev.attendees, newAttendee.trim()]
//       }));
//       setNewAttendee('');
//     }
//   };

//   const handleRemoveAttendee = (index: number) => {
//     setReportData(prev => ({
//       ...prev,
//       attendees: prev.attendees.filter((_, i) => i !== index)
//     }));
//   };

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};
    
//     if (!reportData.summary.trim()) {
//       newErrors.summary = 'Summary is required';
//     }
    
//     if (!reportData.callDate) {
//       newErrors.callDate = 'Call date is required';
//     }
    
//     if (!reportData.callTime) {
//       newErrors.callTime = 'Call time is required';
//     }
    
//     if (reportData.duration !== undefined && reportData.duration < 0) {
//       newErrors.duration = 'Duration cannot be negative';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSave = () => {
//     if (!validateForm()) return;
    
//     // Combine local date and time, then convert to UTC
//     const utcDateTime = combineDateTime(reportData.callDate, reportData.callTime);
    
//     onSave({
//       callDate: utcDateTime,
//       summary: reportData.summary.trim(),
//       nextSteps: reportData.nextSteps.trim(),
//       callType: reportData.callType,
//       duration: reportData.duration,
//       outcome: reportData.outcome,
//       attendees: reportData.attendees.length > 0 ? reportData.attendees : undefined,
//     });
//     onClose();
//   };

//   const getCallTypeIcon = (type: string) => {
//     switch (type) {
//       case 'Inbound': return <Phone className="h-4 w-4 rotate-180" />;
//       case 'Outbound': return <Phone className="h-4 w-4" />;
//       case 'Meeting': return <User className="h-4 w-4" />;
//       case 'Email': return <FileText className="h-4 w-4" />;
//       default: return <Phone className="h-4 w-4" />;
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 dark:border-slate-700">
//           <div className="flex justify-between items-center">
//             <h3 className="text-xl font-bold text-slate-900 dark:text-white">
//               {initialData ? 'Edit Call Report' : 'New Call Report'}
//             </h3>
//             <button 
//               onClick={onClose} 
//               className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="space-y-5">
//             {/* Date and Time Row */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                   <Calendar className="inline h-4 w-4 mr-1" />
//                   Call Date <span className="text-red-500">*</span>
//                 </label>
//                 <input 
//                   type="date" 
//                   value={reportData.callDate} 
//                   onChange={e => handleChange('callDate', e.target.value)} 
//                   className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
//                     errors.callDate ? 'border-red-500' : ''
//                   }`}
//                 />
//                 {errors.callDate && (
//                   <p className="mt-1 text-sm text-red-600">{errors.callDate}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                   <Clock className="inline h-4 w-4 mr-1" />
//                   Time <span className="text-red-500">*</span>
//                 </label>
//                 <input 
//                   type="time" 
//                   value={reportData.callTime} 
//                   onChange={e => handleChange('callTime', e.target.value)} 
//                   className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
//                     errors.callTime ? 'border-red-500' : ''
//                   }`}
//                 />
//                 {errors.callTime && (
//                   <p className="mt-1 text-sm text-red-600">{errors.callTime}</p>
//                 )}
//               </div>
//             </div>

//             {/* Call Type */}
//             <div>
//               <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                 Interaction Type
//               </label>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//                 {(['Outbound', 'Inbound', 'Meeting', 'Email'] as const).map(type => (
//                   <button
//                     key={type}
//                     type="button"
//                     onClick={() => handleChange('callType', type)}
//                     className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
//                       reportData.callType === type
//                         ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
//                         : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
//                     }`}
//                   >
//                     {getCallTypeIcon(type)}
//                     {type}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Duration and Outcome */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                   Duration (minutes)
//                 </label>
//                 <input 
//                   type="number" 
//                   value={reportData.duration || ''} 
//                   onChange={e => handleChange('duration', e.target.value ? parseInt(e.target.value) : undefined)} 
//                   placeholder="e.g., 30"
//                   min="0"
//                   className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
//                     errors.duration ? 'border-red-500' : ''
//                   }`}
//                 />
//                 {errors.duration && (
//                   <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                   Outcome
//                 </label>
//                 <select
//                   value={reportData.outcome || 'Neutral'}
//                   onChange={e => handleChange('outcome', e.target.value as ReportFormData['outcome'])}
//                   className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="Positive">Positive</option>
//                   <option value="Neutral">Neutral</option>
//                   <option value="Negative">Negative</option>
//                   <option value="Follow-up Required">Follow-up Required</option>
//                 </select>
//               </div>
//             </div>

//             {/* Attendees */}
//             <div>
//               <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                 Attendees / Participants
//               </label>
//               <div className="flex gap-2 mb-2">
//                 <input
//                   type="text"
//                   value={newAttendee}
//                   onChange={e => setNewAttendee(e.target.value)}
//                   onKeyPress={e => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       handleAddAttendee();
//                     }
//                   }}
//                   placeholder="Add attendee name"
//                   className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleAddAttendee}
//                   className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Add
//                 </button>
//               </div>
//               {reportData.attendees.length > 0 && (
//                 <div className="flex flex-wrap gap-2">
//                   {reportData.attendees.map((attendee, index) => (
//                     <span
//                       key={index}
//                       className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm"
//                     >
//                       {attendee}
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveAttendee(index)}
//                         className="ml-1 text-gray-500 hover:text-red-600"
//                       >
//                         <X className="h-3 w-3" />
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Summary */}
//             <div>
//               <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                 Discussion Summary <span className="text-red-500">*</span>
//               </label>
//               <textarea 
//                 rows={4} 
//                 value={reportData.summary} 
//                 onChange={e => handleChange('summary', e.target.value)} 
//                 placeholder="Summarize the key points discussed..."
//                 className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 resize-none ${
//                   errors.summary ? 'border-red-500' : ''
//                 }`}
//               />
//               {errors.summary && (
//                 <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
//               )}
//             </div>

//             {/* Next Steps */}
//             <div>
//               <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
//                 Next Steps / Follow-up Actions
//               </label>
//               <textarea 
//                 rows={3} 
//                 value={reportData.nextSteps} 
//                 onChange={e => handleChange('nextSteps', e.target.value)} 
//                 placeholder="List any action items or follow-up tasks..."
//                 className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 resize-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-200 dark:border-slate-700">
//           <div className="flex justify-end gap-3">
//             <button 
//               type="button" 
//               onClick={onClose} 
//               className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
//             >
//               Cancel
//             </button>
//             <button 
//               type="button" 
//               onClick={handleSave} 
//               className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
//             >
//               {initialData ? 'Update Report' : 'Save Report'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// =================================================================================
// FILE: src/features/case/components/CallReportModal.tsx - Updated with WAV upload support
// =================================================================================
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, Clock, Calendar, FileText, User, Upload, Mic, File, Trash2 } from 'lucide-react';
import type { CallReport } from '@/types/entities';
import { formatDateForInput, formatTimeForInput, combineDateTime } from '@/lib/dateUtils';

interface CallReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportData: Omit<CallReport, 'reportId'>, audioFile?: File) => void;
  initialData?: CallReport | null;
}

type ReportFormData = {
  callDate: string;      // Local date (YYYY-MM-DD)
  callTime: string;      // Local time (HH:MM)
  summary: string;
  nextSteps: string;
  callType?: 'Inbound' | 'Outbound' | 'Meeting' | 'Email';
  duration?: number;
  outcome?: 'Positive' | 'Neutral' | 'Negative' | 'Follow-up Required';
  attendees: string[];
  audioDocumentId?: string; // Reference to uploaded audio in csob_documents
};

export function CallReportModal({ isOpen, onClose, onSave, initialData }: CallReportModalProps) {
  const [reportData, setReportData] = useState<ReportFormData>({
    callDate: new Date().toISOString().split('T')[0],
    callTime: new Date().toTimeString().slice(0, 5),
    summary: '',
    nextSteps: '',
    callType: 'Outbound',
    duration: undefined,
    outcome: 'Neutral',
    attendees: [],
    audioDocumentId: undefined,
  });

  const [newAttendee, setNewAttendee] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing mode - convert UTC to local date/time
        setReportData({
          callDate: formatDateForInput(initialData.callDate),
          callTime: formatTimeForInput(initialData.callDate),
          summary: initialData.summary,
          nextSteps: initialData.nextSteps || '',
          callType: initialData.callType || 'Outbound',
          duration: initialData.duration,
          outcome: initialData.outcome || 'Neutral',
          attendees: initialData.attendees || [],
          audioDocumentId: initialData.audioDocumentId,
        });
      } else {
        // Create mode - use current local date/time
        const now = new Date();
        setReportData({
          callDate: now.toISOString().split('T')[0],
          callTime: now.toTimeString().slice(0, 5),
          summary: '',
          nextSteps: '',
          callType: 'Outbound',
          duration: undefined,
          outcome: 'Neutral',
          attendees: [],
          audioDocumentId: undefined,
        });
      }
      setErrors({});
      setNewAttendee('');
      setSelectedAudioFile(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof ReportFormData>(
    field: K,
    value: ReportFormData[K]
  ) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      setReportData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()]
      }));
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (index: number) => {
    setReportData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };

  // Audio file handling
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
      if (validateAudioFile(file)) {
        setSelectedAudioFile(file);
      }
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateAudioFile(file)) {
        setSelectedAudioFile(file);
        
        // Auto-populate duration if possible (for future enhancement)
        // This would require reading the audio file metadata
      }
    }
  };

  const validateAudioFile = (file: File) => {
    const maxSize = 100 * 1024 * 1024; // 100MB for audio files
    const allowedTypes = [
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/mpeg', // Also allow MP3
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/m4a',
    ];
    
    if (file.size > maxSize) {
      alert('Audio file size must be less than 100MB');
      return false;
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.wav')) {
      alert('Please select a supported audio file type (WAV, MP3, OGG, M4A)');
      return false;
    }
    
    return true;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeAudioFile = () => {
    setSelectedAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!reportData.summary.trim()) {
      newErrors.summary = 'Summary is required';
    }
    
    if (!reportData.callDate) {
      newErrors.callDate = 'Call date is required';
    }
    
    if (!reportData.callTime) {
      newErrors.callTime = 'Call time is required';
    }
    
    if (reportData.duration !== undefined && reportData.duration < 0) {
      newErrors.duration = 'Duration cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    // Combine local date and time, then convert to UTC
    const utcDateTime = combineDateTime(reportData.callDate, reportData.callTime);
    
    const callReportData = {
      callDate: utcDateTime,
      summary: reportData.summary.trim(),
      nextSteps: reportData.nextSteps.trim(),
      callType: reportData.callType,
      duration: reportData.duration,
      outcome: reportData.outcome,
      attendees: reportData.attendees.length > 0 ? reportData.attendees : undefined,
      audioDocumentId: reportData.audioDocumentId,
    };
    
    // Pass both the report data and the audio file
    onSave(callReportData, selectedAudioFile || undefined);
    onClose();
  };

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'Inbound': return <Phone className="h-4 w-4 rotate-180" />;
      case 'Outbound': return <Phone className="h-4 w-4" />;
      case 'Meeting': return <User className="h-4 w-4" />;
      case 'Email': return <FileText className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Call Report' : 'New Call Report'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Call Date <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={reportData.callDate} 
                  onChange={e => handleChange('callDate', e.target.value)} 
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
                    errors.callDate ? 'border-red-500' : ''
                  }`}
                />
                {errors.callDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.callDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Time <span className="text-red-500">*</span>
                </label>
                <input 
                  type="time" 
                  value={reportData.callTime} 
                  onChange={e => handleChange('callTime', e.target.value)} 
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
                    errors.callTime ? 'border-red-500' : ''
                  }`}
                />
                {errors.callTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.callTime}</p>
                )}
              </div>
            </div>

            {/* Call Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Interaction Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['Outbound', 'Inbound', 'Meeting', 'Email'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('callType', type)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      reportData.callType === type
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {getCallTypeIcon(type)}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration and Outcome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Duration (minutes)
                </label>
                <input 
                  type="number" 
                  value={reportData.duration || ''} 
                  onChange={e => handleChange('duration', e.target.value ? parseInt(e.target.value) : undefined)} 
                  placeholder="e.g., 30"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 ${
                    errors.duration ? 'border-red-500' : ''
                  }`}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Outcome
                </label>
                <select
                  value={reportData.outcome || 'Neutral'}
                  onChange={e => handleChange('outcome', e.target.value as ReportFormData['outcome'])}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                </select>
              </div>
            </div>

            {/* Audio Recording Upload */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                <Mic className="inline h-4 w-4 mr-1" />
                Call Recording (Optional)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : selectedAudioFile
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !selectedAudioFile && audioInputRef.current?.click()}
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  onChange={handleAudioFileChange}
                  className="hidden"
                  accept="audio/wav,audio/x-wav,audio/wave,audio/mpeg,audio/mp3,audio/ogg,audio/webm,audio/m4a,.wav,.mp3,.ogg,.m4a"
                />
                
                {selectedAudioFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="h-8 w-8 text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {selectedAudioFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(selectedAudioFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAudioFile();
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                      title="Remove audio file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
                        <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        WAV, MP3, OGG, M4A up to 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {reportData.audioDocumentId && !selectedAudioFile && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <File className="inline h-3 w-3 mr-1" />
                  Existing recording attached (ID: {reportData.audioDocumentId})
                </p>
              )}
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Attendees / Participants
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAttendee}
                  onChange={e => setNewAttendee(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  placeholder="Add attendee name"
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {reportData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reportData.attendees.map((attendee, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm"
                    >
                      {attendee}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index)}
                        className="ml-1 text-gray-500 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Discussion Summary <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows={4} 
                value={reportData.summary} 
                onChange={e => handleChange('summary', e.target.value)} 
                placeholder="Summarize the key points discussed..."
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.summary ? 'border-red-500' : ''
                }`}
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
              )}
            </div>

            {/* Next Steps */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Next Steps / Follow-up Actions
              </label>
              <textarea 
                rows={3} 
                value={reportData.nextSteps} 
                onChange={e => handleChange('nextSteps', e.target.value)} 
                placeholder="List any action items or follow-up tasks..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Update Report' : 'Save Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}