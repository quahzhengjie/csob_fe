// =================================================================================
// FILE: src/features/party/components/PartyProfileView.tsx
// =================================================================================

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Building,
  Calendar,
  CreditCard,
  MapPin,
  Shield,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  Loader2,
  Plus,
  Activity,
  Clock,
  FileIcon,
  UserCheck,
  Eye
} from 'lucide-react';

import type { Party, Document, ScannerProfile } from '@/types/entities';
import { 
  updateParty, 
  uploadDocument, 
  getPartyDetails, 
  triggerScan,
  getCaseDetails
} from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';
import { formatLocalDateTime } from '@/lib/dateUtils';
import { generatePartyChecklist, PartyChecklistSection, PartyChecklistDocument } from '../utils/checklist';
import { DocumentHistoryModal } from '@/features/case/components/DocumentHistoryModal';
import { DocumentPreviewModal } from '@/features/case/components/DocumentPreviewModal';
import { DocumentRequirement } from '@/features/case/components/DocumentRequirement';
import { PartyRoleEditor } from './PartyRoleEditor';
import { AddToCaseModal } from './AddToCaseModal';
import { ImprovedPEPSection } from './ImprovedPEPSection';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                     */
/* -------------------------------------------------------------------------- */
export interface PartyAssociation {
  caseId: string;
  entityName: string;
  entityType: string;
  roles: string[];
}

interface PartyProfileViewProps {
  details: {
    party: Party;
    documents: Document[];
    associations: PartyAssociation[];
    scannerProfiles: ScannerProfile[];
  };
}

interface ScanResponse {
  documentId?: string;
  status?: string;
  message?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ActivityLogEntry {
  activityId: string;
  type: string;
  details: string;
  performedBy: string;
  timestamp: string;
  caseId?: string;
  entityName?: string;
}

type TabId = 'overview' | 'documents' | 'cases' | 'risk' | 'activity';

/* -------------------------------------------------------------------------- */
/* HOOKS                                                                     */
/* -------------------------------------------------------------------------- */
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                            */
/* -------------------------------------------------------------------------- */

// Enhanced Toast Component
const ToastContainer = memo(({ toasts }: { toasts: Toast[] }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          className={`
            p-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]
            ${toast.type === 'success' ? 'bg-green-500' : ''}
            ${toast.type === 'error' ? 'bg-red-500' : ''}
            ${toast.type === 'info' ? 'bg-blue-500' : ''}
            text-white
          `}
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.type === 'info' && <AlertCircle size={20} />}
          <span className="flex-1">{toast.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
));

ToastContainer.displayName = 'ToastContainer';

// Upload Progress Component
const UploadProgress = ({ fileName, progress }: { fileName: string; progress: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className="fixed bottom-4 left-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
  >
    <div className="flex items-center gap-3 mb-2">
      <Upload size={20} className="text-blue-500" />
      <span className="text-sm font-medium">{fileName}</span>
    </div>
    <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.3 }}
      />
    </div>
    <span className="text-xs text-slate-500 mt-1">{progress}% complete</span>
  </motion.div>
);

// Enhanced Profile Header
const ProfileHeader = ({ party }: { party: Party }) => {
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (party.birthDate) {
      const birth = new Date(party.birthDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    }
  }, [party.birthDate]);

  const getStatusColor = () => {
    if (party.isPEP) return 'from-red-500 to-red-600';
    return 'from-green-500 to-green-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm mb-6"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500" />
      </div>

      {/* Breadcrumb navigation */}
      <nav className="relative flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
        <Link
          href="/dashboard"
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
        <Link
          href="/parties"
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          Parties
        </Link>
        <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
        <span className="text-slate-900 dark:text-white font-medium" aria-current="page">
          {party.name}
        </span>
      </nav>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Enhanced avatar with status ring */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`
                absolute inset-0 rounded-full bg-gradient-to-br ${getStatusColor()} 
                blur-md opacity-30 scale-110
              `}
            />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold shadow-lg">
              {party.firstName[0]}{party.lastName[0]}
            </div>
            {party.isPEP && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md"
                title="Politically Exposed Person"
              >
                <Shield size={14} className="text-white" />
              </motion.div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {party.name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CreditCard size={14} />
                {party.idType}: {party.identityNo}
              </p>
              {age !== null && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={14} />
                    {age} years old
                  </p>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin size={14} />
                {party.residencyStatus}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Party ID: {party.partyId}
          </span>
          {party.isPEP && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium"
            >
              PEP - {party.pepCountry}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ 
  activeTab, 
  onTabChange, 
  documentCount, 
  associationCount, 
  isPEP,
  activityCount
}: { 
  activeTab: TabId; 
  onTabChange: (tab: TabId) => void; 
  documentCount: number; 
  associationCount: number; 
  isPEP: boolean; 
  activityCount: number;
}) => {
  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: User, count: null },
    { id: 'documents' as TabId, label: 'Documents', icon: FileText, count: documentCount },
    { id: 'cases' as TabId, label: 'Cases', icon: Building, count: associationCount },
    { id: 'risk' as TabId, label: 'Risk Profile', icon: Shield, count: isPEP ? 1 : null },
    { id: 'activity' as TabId, label: 'Activity', icon: Activity, count: activityCount }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-1 mb-6">
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }
            `}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== null && (
              <span className={`
                px-1.5 py-0.5 rounded text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }
              `}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Party-specific Document Checklist Component
const PartyDocumentChecklist = ({ 
  sections,
  scannerProfiles,
  onUploadDocument,
  onScan,
  onShowHistory,
  onPreview
}: {
  sections: PartyChecklistSection[];
  scannerProfiles: ScannerProfile[];
  onUploadDocument: (doc: PartyChecklistDocument, details: { expiryDate: string; comments: string; file?: File }) => void;
  onScan: (doc: PartyChecklistDocument, details: { expiryDate: string; comments: string; scanDetails: Record<string, unknown> }) => Promise<ScanResponse>;
  onShowHistory: (doc: PartyChecklistDocument) => void;
  onPreview: (doc: PartyChecklistDocument) => void;
}) => {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const handleSelectDoc = (doc: PartyChecklistDocument) => {
    const docId = doc.id || `${doc.ownerId}-${doc.name}`;
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {section.category}
          </h3>
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {section.documents.map((doc, docIndex) => (
              <DocumentRequirement
                key={`${doc.ownerId}-${doc.name}-${docIndex}`}
                document={doc as PartyChecklistDocument} 
                scannerProfiles={scannerProfiles}
                isSelected={selectedDocs.has(doc.id || `${doc.ownerId}-${doc.name}`)}
                onSelect={() => handleSelectDoc(doc)}
                onLink={() => {}} 
                onUpload={onUploadDocument}
                onScan={onScan}
                onShowHistory={onShowHistory}
                onPreview={onPreview}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Overview Tab Content
const OverviewTab = ({ 
  party, 
  onSave, 
  showToast 
}: { 
  party: Party; 
  onSave: (updatedParty: Party) => Promise<void>; 
  showToast: (type: 'success' | 'error' | 'info', message: string) => void; 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Party>(party);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditData({
      ...party,
      email: party.email || '',
      phone: party.phone || '',
      address: party.address || '',
      employmentStatus: party.employmentStatus || '',
      employerName: party.employerName || ''
    });
  }, [party]);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return !value.trim() ? `${name === 'firstName' ? 'First' : 'Last'} name is required` : null;
      case 'identityNo':
        if (!value.trim()) return 'ID number is required';
        if (editData.idType === 'NRIC' && !/^[STFG]\d{7}[A-Z]$/i.test(value)) {
          return 'Invalid NRIC format';
        }
        return null;
      case 'birthDate':
        const date = new Date(value);
        const today = new Date();
        if (date > today) return 'Birth date cannot be in the future';
        return null;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        return null;
      case 'phone':
        if (value && !/^[+\d\s-()]+$/.test(value)) {
          return 'Invalid phone format';
        }
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const handleSaveClick = async () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['firstName', 'lastName', 'identityNo', 'birthDate', 'email', 'phone'] as const;

    fieldsToValidate.forEach(key => {
      const value = editData[key] || '';
      const error = validateField(key, value as string);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      const finalData = {
        ...editData,
        name: `${editData.firstName} ${editData.lastName}`.trim(),
        email: editData.email?.trim() || undefined,
        phone: editData.phone?.trim() || undefined,
        address: editData.address?.trim() || undefined,
        employmentStatus: editData.employmentStatus || undefined,
        employerName: editData.employerName?.trim() || undefined
      };
      
      await onSave(finalData);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully');
    } catch {
      showToast('error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const commonInputClass = 'w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>
          <WithPermission permission="case:update">
            <button 
              onClick={() => isEditing ? handleSaveClick() : setIsEditing(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : isEditing ? (
                <>
                  <Save size={14} /> Save
                </>
              ) : (
                <>
                  <Edit size={14} /> Edit
                </>
              )}
            </button>
          </WithPermission>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={editData.firstName}
                  onChange={handleInputChange}
                  className={`${commonInputClass} ${errors.firstName ? 'border-red-500' : ''}`}
                />
              ) : (
                <p className="text-slate-900 dark:text-slate-100">{party.firstName}</p>
              )}
              {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={editData.lastName}
                  onChange={handleInputChange}
                  className={`${commonInputClass} ${errors.lastName ? 'border-red-500' : ''}`}
                />
              ) : (
                <p className="text-slate-900 dark:text-slate-100">{party.lastName}</p>
              )}
              {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
            {isEditing ? (
              <input
                type="date"
                name="birthDate"
                value={editData.birthDate}
                onChange={handleInputChange}
                className={`${commonInputClass} ${errors.birthDate ? 'border-red-500' : ''}`}
              />
            ) : (
              <p className="text-slate-900 dark:text-slate-100">
                {formatLocalDateTime(party.birthDate, { dateStyle: 'long', timeStyle: undefined })}
              </p>
            )}
            {errors.birthDate && <p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Type & Number</label>
            {isEditing ? (
              <div className="flex gap-2">
                <select
                  name="idType"
                  value={editData.idType}
                  onChange={handleInputChange}
                  className={`${commonInputClass} w-auto flex-shrink-0`}
                >
                  <option value="NRIC">NRIC</option>
                  <option value="Passport">Passport</option>
                  <option value="FIN">FIN</option>
                </select>
                <input
                  type="text"
                  name="identityNo"
                  value={editData.identityNo}
                  onChange={handleInputChange}
                  placeholder="e.g., S1234567A"
                  className={`${commonInputClass} flex-1 ${errors.identityNo ? 'border-red-500' : ''}`}
                />
              </div>
            ) : (
              <p className="text-slate-900 dark:text-slate-100">{party.idType}: {party.identityNo}</p>
            )}
            {errors.identityNo && <p className="text-xs text-red-600 mt-1">{errors.identityNo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
            {isEditing ? (
              <select
                name="employmentStatus"
                value={editData.employmentStatus || ''}
                onChange={handleInputChange}
                className={commonInputClass}
              >
                <option value="">Select status</option>
                <option value="Employed">Employed</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Retired">Retired</option>
                <option value="Student">Student</option>
              </select>
            ) : (
              <p className="text-slate-900 dark:text-slate-100">{party.employmentStatus || 'Not specified'}</p>
            )}
          </div>

          {(editData.employmentStatus === 'Employed' || party.employerName) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employer Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="employerName"
                  value={editData.employerName || ''}
                  onChange={handleInputChange}
                  placeholder="Company name"
                  className={commonInputClass}
                />
              ) : (
                <p className="text-slate-900 dark:text-slate-100">{party.employerName || 'Not specified'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <div className="flex-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email || ''}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className={`${commonInputClass} ${errors.email ? 'border-red-500' : ''}`}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {party.email || 'Not provided'}
                </p>
              )}
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-slate-400" />
            <div className="flex-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="+65 1234 5678"
                  className={`${commonInputClass} ${errors.phone ? 'border-red-500' : ''}`}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {party.phone || 'Not provided'}
                </p>
              )}
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-slate-400" />
            <div className="flex-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={editData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Full address"
                  className={commonInputClass}
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {party.address || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Tab Component
const ActivityTab = ({ 
  party, 
  associations 
}: { 
  party: Party; 
  associations: PartyAssociation[]; 
}) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivityLogs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const allLogs: ActivityLogEntry[] = [];
        
        // Fetch activity logs from all associated cases
        for (const association of associations) {
          try {
            const caseDetails = await getCaseDetails(association.caseId);
            if (caseDetails?.caseData?.activities) {
               // Filter activities related to this party or show all case activities
               const enrichedLogs = caseDetails.caseData.activities
               .filter(() => {
                 // Include all activities, but could filter by party name if needed
                 // return log.details.includes(party.name) || log.details.includes(party.partyId);
                 return true; // Show all activities for now
               })
               .map((log) => ({
                  activityId: log.activityId,
                  type: log.type,
                  details: log.details,
                  performedBy: log.performedBy,
                  timestamp: log.timestamp,
                  caseId: association.caseId,
                  entityName: association.entityName
                }));
              allLogs.push(...enrichedLogs);
            }
          } catch (caseError) {
            console.warn(`Failed to load logs for case ${association.caseId}:`, caseError);
          }
        }
        
        // Sort by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityLogs(allLogs);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
        setError('Failed to load activity logs');
      } finally {
        setIsLoading(false);
      }
    };

    if (associations.length > 0) {
      loadActivityLogs();
    } else {
      setIsLoading(false);
    }
  }, [party.partyId, party.name, associations]);

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document_upload':
      case 'document_uploaded':
        return <Upload className="h-4 w-4" />;
      case 'document_verification':
      case 'document_verified':
        return <UserCheck className="h-4 w-4" />;
      case 'party_added':
        return <User className="h-4 w-4" />;
      case 'case_created':
        return <Building className="h-4 w-4" />;
      case 'status_change':
        return <CheckCircle className="h-4 w-4" />;
      case 'document_view':
        return <Eye className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document_upload':
      case 'document_uploaded':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'document_verification':
      case 'document_verified':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'party_added':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'case_created':
        return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'status_change':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'document_view':
        return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  if (associations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Activity Yet</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {party.name} is not associated with any cases yet. Activity will appear here once they are added to cases.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-3 text-slate-500">Loading activity logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Activity</h3>
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Activity Log ({activityLogs.length})
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          All activities related to {party.name} across {associations.length} case{associations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {activityLogs.length === 0 ? (
        <div className="p-8 text-center">
          <Activity size={32} className="mx-auto mb-3 text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400">No activity recorded yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {activityLogs.map((log, index) => (
            <motion.div
              key={log.activityId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${getActivityColor(log.type)}`}>
                  {getActivityIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {log.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Clock size={12} />
                      {(() => {
                        try {
                          // Use the same approach as ActivityLogView component
                          const date = new Date(log.timestamp);
                          if (isNaN(date.getTime())) {
                            console.warn('Invalid timestamp:', log.timestamp);
                            return 'Invalid date';
                          }
                          return date.toLocaleString();
                        } catch (error) {
                          console.warn('Failed to format activity timestamp:', log.timestamp, error);
                          return 'Invalid date';
                        }
                      })()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    {log.details}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      By: {log.performedBy || 'System'}
                    </span>
                    {log.entityName && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                        {log.entityName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */
export default function PartyProfileView({ details: initialDetails }: PartyProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [party, setParty] = useState<Party>(initialDetails.party);
  const [documents, setDocuments] = useState<Document[]>(initialDetails.documents);
  const [associations, setAssociations] = useState<PartyAssociation[]>(initialDetails.associations || []);
  const [scannerProfiles, setScannerProfiles] = useState<ScannerProfile[]>(initialDetails.scannerProfiles);
  const [checklist, setChecklist] = useState<PartyChecklistSection[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [historyModalDoc, setHistoryModalDoc] = useState<{
    documentType: string;
    versions: Document[];
  } | null>(null);
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null);
  const [isAddToCaseModalOpen, setIsAddToCaseModalOpen] = useState(false);
  
  const { toasts, showToast } = useToast();

  const existingCaseIds = useMemo(() => 
    associations.map(assoc => assoc.caseId),
    [associations]
  );

  // Calculate activity count for tab badge
  const activityCount = useMemo(() => {
    // This will be updated when we load actual activity logs
    return 0; // Will be set by the ActivityTab when logs are loaded
  }, []);

  useEffect(() => {
    setParty(initialDetails.party);
    setDocuments(initialDetails.documents);
    setAssociations(initialDetails.associations || []);
    setScannerProfiles(initialDetails.scannerProfiles);
  }, [initialDetails]);

  useEffect(() => {
    const loadChecklist = async () => {
      if (party) {
        setIsLoadingChecklist(true);
        try {
          const generatedChecklist = await generatePartyChecklist(party, documents);
          setChecklist(generatedChecklist);
        } catch {
          showToast('error', 'Failed to load document checklist');
        } finally {
          setIsLoadingChecklist(false);
        }
      }
    };
    loadChecklist();
  }, [party, documents, showToast]);

  const refreshPartyData = async () => {
    try {
      const updatedDetails = await getPartyDetails(party.partyId);
      if (updatedDetails) {
        setParty(updatedDetails.party);
        setDocuments(updatedDetails.documents);
      }
    } catch {
      showToast('error', 'Failed to refresh party data');
    }
  };

  const handleSave = async (updatedData: Party) => {
    try {
      const updatedParty = await updateParty(party.partyId, updatedData);
      
      if (updatedParty) {
        setParty(updatedParty);
        await refreshPartyData();
      }
    } catch (error) {
      console.error('Failed to update party:', error);
      throw error;
    }
  };

  const handleUploadDocument = async (doc: PartyChecklistDocument, details: { expiryDate: string, comments: string, file?: File }) => {
    if (!details.file) return;
    
    setUploadProgress({ fileName: details.file.name, progress: 0 });
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return null;
          const newProgress = Math.min(prev.progress + 10, 90);
          return { ...prev, progress: newProgress };
        });
      }, 200);

      await uploadDocument(party.partyId, 'PARTY', doc.name, details.file, details);
      
      clearInterval(progressInterval);
      setUploadProgress({ fileName: details.file.name, progress: 100 });
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
      
      await refreshPartyData();
      showToast('success', 'Document uploaded successfully');
    } catch {
      setUploadProgress(null);
      showToast('error', 'Failed to upload document');
    }
  };

  const allChecklistDocs = useMemo(() => {
    const docs: PartyChecklistDocument[] = [];
    checklist.forEach(section => {
      section.documents.forEach(doc => {
        if (doc.status !== 'Missing') {
          docs.push(doc);
        }
      });
    });
    return docs;
  }, [checklist]);

  const handleScanUpload = async (doc: PartyChecklistDocument, scanDetails: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }): Promise<ScanResponse> => {
    try {
      const ownerType = 'PARTY';
      const ownerId = party.partyId;
      
      const profileName = (scanDetails.scanDetails.profile as string) || 
                         (scanDetails.scanDetails.profileName as string) || 
                         'Default Scanner';
      const source = (scanDetails.scanDetails.source as string) || 'feeder';

      const scanRequest = {
        profileName: profileName,
        ownerType,
        ownerId,
        documentType: doc.name,
        source: source,
        format: (scanDetails.scanDetails.format as string) || 'pdf'
      };
      
      showToast('info', 'Scanning document...');
      const scanResult = await triggerScan(scanRequest);
      
      if (scanResult.documentId) {
        await refreshPartyData();
        showToast('success', 'Document scanned successfully');
      }
      
      return scanResult;
    } catch (error) {
      console.error('Failed to scan document:', error);
      if (error instanceof Error && error.message.includes('500')) {
        showToast('error', 'Scanner not available. Please ensure the scanner is connected.');
      } else {
        showToast('error', 'Failed to scan document. Please try again.');
      }
      throw error;
    }
  };

  const handleShowHistory = (doc: PartyChecklistDocument) => {
    if (doc.allVersions && doc.allVersions.length > 0) {
      setHistoryModalDoc({ 
        documentType: doc.name,
        versions: doc.allVersions 
      });
    } else {
      const documentsOfType = documents.filter(d => 
        d.ownerId === party.partyId && d.documentType === doc.name
      );
      
      if (documentsOfType.length > 0) {
        setHistoryModalDoc({ 
          documentType: doc.name,
          versions: documentsOfType 
        });
      } else {
        showToast('error', 'Unable to load document history. Please refresh and try again.');
      }
    }
  };

  const handlePreviewDocument = (doc: PartyChecklistDocument) => {
    if (doc.status === 'Missing') return;
    const docIndex = allChecklistDocs.findIndex(d => d.name === doc.name && d.ownerId === doc.ownerId);
    if (docIndex !== -1) {
      setPreviewState({ isOpen: true, startIndex: docIndex });
    }
  };

  const handleUpdateAssociations = async (updatedAssociations: PartyAssociation[]) => {
    setAssociations(updatedAssociations);
    try {
      await refreshPartyData();
    } catch (error) {
      console.error('Failed to refresh party data:', error);
      showToast('error', 'Failed to refresh data. Please reload the page.');
    }
  };

  const handleAddToCaseSuccess = (caseId: string, entityName: string, roles: string[]) => {
    const newAssociation: PartyAssociation = {
      caseId,
      entityName,
      entityType: 'Unknown',
      roles
    };
    
    setAssociations(prev => [...prev, newAssociation]);
    refreshPartyData();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab party={party} onSave={handleSave} showToast={showToast} />;
      
      case 'documents':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Document Checklist</h3>
            </div>
            {!isLoadingChecklist && checklist.length > 0 ? (
              <PartyDocumentChecklist
                sections={checklist}
                scannerProfiles={scannerProfiles}
                onUploadDocument={handleUploadDocument}
                onScan={handleScanUpload}
                onShowHistory={handleShowHistory}
                onPreview={handlePreviewDocument}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-3 text-slate-500">Loading documents...</span>
              </div>
            )}
          </div>
        );
      
      case 'cases':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Associated Cases ({associations.length})
              </h3>
              <WithPermission permission="case:update">
                <button
                  onClick={() => setIsAddToCaseModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Add to Case
                </button>
              </WithPermission>
            </div>
            <PartyRoleEditor
              partyId={party.partyId}
              partyName={party.name}
              associations={associations}
              onUpdate={handleUpdateAssociations}
              showToast={showToast}
            />
          </div>
        );
      
      case 'risk':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Risk Profile</h3>
            <ImprovedPEPSection
              isPEP={party.isPEP}
              pepCountry={party.pepCountry || ''}
              pepRemarks={party.pepRemarks || ''}
              onPEPChange={() => {}}
              onPEPCountryChange={() => {}}
              onPEPRemarksChange={() => {}}
              isEditing={false}
            />
          </div>
        );
      
      case 'activity':
        return <ActivityTab party={party} associations={associations} />;
      
      default:
        return <OverviewTab party={party} onSave={handleSave} showToast={showToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader party={party} />
        
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          documentCount={documents.length}
          associationCount={associations.length}
          isPEP={Boolean(party.isPEP)}
          activityCount={activityCount}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Modals */}
        <DocumentHistoryModal
          isOpen={!!historyModalDoc}
          onClose={() => setHistoryModalDoc(null)}
          documentType={historyModalDoc?.documentType || ''}
          versions={historyModalDoc?.versions || []}
          onMakeCurrent={async () => {}}
          onApprove={async () => {}}
          onReject={async () => {}}
          onRefresh={async () => {}}
        />
        
        <DocumentPreviewModal
          isOpen={previewState.isOpen}
          onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })}
          documents={allChecklistDocs}
          startIndex={previewState.startIndex}
        />

        <AddToCaseModal
          isOpen={isAddToCaseModalOpen}
          onClose={() => setIsAddToCaseModalOpen(false)}
          partyId={party.partyId}
          partyName={party.name}
          existingCaseIds={existingCaseIds}
          onSuccess={handleAddToCaseSuccess}
          showToast={showToast}
        />

        <AnimatePresence>
          {uploadProgress && (
            <UploadProgress 
              fileName={uploadProgress.fileName} 
              progress={uploadProgress.progress} 
            />
          )}
        </AnimatePresence>

        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}