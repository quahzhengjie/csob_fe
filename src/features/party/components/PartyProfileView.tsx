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
  X,
  Building,
  Calendar,
  CreditCard,
  MapPin,
  Briefcase,
  Shield,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  Loader2,
  ExternalLink
} from 'lucide-react';

import type { Party, Document, ScannerProfile } from '@/types/entities';
import { updateParty, uploadDocument, getPartyDetails, updateDocumentLink, updateDocumentStatus, triggerScan } from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';
import { formatLocalDateTime } from '@/lib/dateUtils';
import { generatePartyChecklist, PartyChecklistSection, PartyChecklistDocument } from '../utils/checklist';
import { DocumentHistoryModal } from '@/features/case/components/DocumentHistoryModal';
import { DocumentPreviewModal } from '@/features/case/components/DocumentPreviewModal';
import { DocumentRequirement } from '@/features/case/components/DocumentRequirement';

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

type CardPriority = 'high' | 'normal' | 'low';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

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

// Enhanced Info Card
const InfoCard = ({
  title,
  actions,
  children,
  count,
  icon: Icon,
  isLoading = false,
  className = '',
  priority = 'normal',
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  count?: number;
  icon?: React.ElementType;
  isLoading?: boolean;
  className?: string;
  priority?: CardPriority;
}) => {
  const priorityClasses: Record<CardPriority, string> = {
    high: 'ring-2 ring-blue-500 shadow-lg scale-[1.02]',
    normal: 'shadow-sm',
    low: 'opacity-95'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        p-6 rounded-xl border bg-white dark:bg-slate-800 
        dark:border-slate-700 transition-all duration-200
        ${priorityClasses[priority]} ${className}
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {Icon && (
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon size={20} className="text-slate-600 dark:text-slate-400" />
            </motion.div>
          )}
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({count})
              </span>
            )}
          </h2>
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </motion.div>
  );
};

// Loading Skeleton
const DocumentSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
    ))}
  </div>
);


// Profile Detail Item Component
const ProfileDetailItem = ({
  label,
  value,
  isEditing = false,
  children,
  icon: Icon,
  error,
}: {
  label: string;
  value?: string;
  isEditing?: boolean;
  children?: React.ReactNode;
  icon?: React.ElementType;
  error?: string;
}) => (
  <div>
    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
      {Icon && <Icon size={14} />}
      {label}
    </dt>
    {isEditing ? (
      <>
        <dd>{children}</dd>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </>
    ) : (
      <dd className="mt-1 text-md text-slate-900 dark:text-slate-100">
        {value || '-'}
      </dd>
    )}
  </div>
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
      className="relative overflow-hidden p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm"
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
          href="/cases"
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          Cases
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

// Enhanced Profile Details Card
const ProfileDetailsCard = ({
  party,
  onSave,
  showToast,
}: {
  party: Party;
  onSave: (updatedParty: Party) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Party>({
    ...party,
    email: party.email || '',
    phone: party.phone || '',
    address: party.address || '',
    employmentStatus: party.employmentStatus || '',
    employerName: party.employerName || '',
    pepCountry: party.pepCountry || '',
    isPEP: party.isPEP === true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'risk'>('personal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setEditData({
      ...party,
      email: party.email || '',
      phone: party.phone || '',
      address: party.address || '',
      employmentStatus: party.employmentStatus || '',
      employerName: party.employerName || '',
      pepCountry: party.pepCountry || '',
      isPEP: party.isPEP === true
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setEditData(prev => ({ ...prev, [name]: finalValue }));
    setHasUnsavedChanges(true);

    const error = validateField(name, value as string);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
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
      // Fixed: Changed null assignments to undefined for optional fields
      const finalData = {
        ...editData,
        name: `${editData.firstName} ${editData.lastName}`.trim(),
        email: editData.email?.trim() || undefined,
        phone: editData.phone?.trim() || undefined,
        address: editData.address?.trim() || undefined,
        employmentStatus: editData.employmentStatus || undefined,
        employerName: editData.employerName?.trim() || undefined,
        pepCountry: editData.pepCountry?.trim() || undefined,
        isPEP: editData.isPEP === true
      };
      
      await onSave(finalData);
      setIsEditing(false);
      setActiveTab('personal');
      setHasUnsavedChanges(false);
      showToast('success', 'Profile updated successfully');
    } catch {
      showToast('error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }

    setEditData({
      ...party,
      email: party.email || '',
      phone: party.phone || '',
      address: party.address || '',
      employmentStatus: party.employmentStatus || '',
      employerName: party.employerName || '',
      pepCountry: party.pepCountry || '',
      isPEP: party.isPEP === true
    });
    setErrors({});
    setIsEditing(false);
    setActiveTab('personal');
    setHasUnsavedChanges(false);
  };

  const commonInputClass =
    'w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors';

  const validationSummary = useMemo(() => {
    const summary: Record<string, { errors: number; warnings: number }> = {
      personal: { errors: 0, warnings: 0 },
      contact: { errors: 0, warnings: 0 },
      risk: { errors: 0, warnings: 0 }
    };

    // Count errors per tab
    if (errors.firstName || errors.lastName || errors.birthDate || errors.identityNo) {
      summary.personal.errors = Object.values({ 
        firstName: errors.firstName, 
        lastName: errors.lastName,
        birthDate: errors.birthDate,
        identityNo: errors.identityNo
      }).filter(Boolean).length;
    }

    if (errors.email || errors.phone) {
      summary.contact.errors = Object.values({ 
        email: errors.email, 
        phone: errors.phone 
      }).filter(Boolean).length;
    }

    return summary;
  }, [errors]);

  const EditActions = (
    <WithPermission permission="case:update">
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelClick}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors"
            >
              <X size={16} /> Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveClick}
              disabled={isSaving || Object.values(errors).some(e => e)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save
                </>
              )}
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
          >
            <Edit size={16} /> Edit
          </motion.button>
        )}
      </div>
    </WithPermission>
  );

  const tabContent = {
    personal: (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <ProfileDetailItem
          label="First Name"
          value={party.firstName}
          isEditing={true}
          icon={User}
          error={errors.firstName}
        >
          <input
            type="text"
            name="firstName"
            value={editData.firstName}
            onChange={handleInputChange}
            className={`${commonInputClass} ${errors.firstName ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Last Name"
          value={party.lastName}
          isEditing={true}
          icon={User}
          error={errors.lastName}
        >
          <input
            type="text"
            name="lastName"
            value={editData.lastName}
            onChange={handleInputChange}
            className={`${commonInputClass} ${errors.lastName ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.lastName}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Date of Birth"
          value={formatLocalDateTime(party.birthDate, { dateStyle: 'long', timeStyle: undefined })}
          isEditing={true}
          icon={Calendar}
          error={errors.birthDate}
        >
          <input
            type="date"
            name="birthDate"
            value={editData.birthDate}
            onChange={handleInputChange}
            className={`${commonInputClass} ${errors.birthDate ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.birthDate}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="ID Type & Number"
          value={`${party.idType}: ${party.identityNo}`}
          isEditing={true}
          icon={CreditCard}
          error={errors.identityNo}
        >
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
              aria-invalid={!!errors.identityNo}
            />
          </div>
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Residency Status"
          value={party.residencyStatus}
          isEditing={true}
          icon={MapPin}
        >
          <select
            name="residencyStatus"
            value={editData.residencyStatus}
            onChange={handleInputChange}
            className={commonInputClass}
          >
            <option value="Singaporean/PR">Singaporean/PR</option>
            <option value="Foreigner">Foreigner</option>
          </select>
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Employment Status"
          value={party.employmentStatus ?? 'Not specified'}
          isEditing={true}
          icon={Briefcase}
        >
          <select
            name="employmentStatus"
            value={editData.employmentStatus ?? ''}
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
        </ProfileDetailItem>

        {(editData.employmentStatus === 'Employed') && (
          <ProfileDetailItem
            label="Employer Name"
            value={party.employerName ?? 'Not specified'}
            isEditing={true}
            icon={Building}
          >
            <input
              type="text"
              name="employerName"
              value={editData.employerName ?? ''}
              onChange={handleInputChange}
              placeholder="Company name"
              className={commonInputClass}
            />
          </ProfileDetailItem>
        )}
      </dl>
    ),
    contact: (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <ProfileDetailItem
          label="Email Address"
          value={party.email ?? 'Not provided'}
          isEditing={true}
          icon={Mail}
          error={errors.email}
        >
          <input
            type="email"
            name="email"
            value={editData.email ?? ''}
            onChange={handleInputChange}
            placeholder="email@example.com"
            className={`${commonInputClass} ${errors.email ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.email}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Phone Number"
          value={party.phone ?? 'Not provided'}
          isEditing={true}
          icon={Phone}
          error={errors.phone}
        >
          <input
            type="tel"
            name="phone"
            value={editData.phone ?? ''}
            onChange={handleInputChange}
            placeholder="+65 1234 5678"
            className={`${commonInputClass} ${errors.phone ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.phone}
          />
        </ProfileDetailItem>

        <div className="md:col-span-2">
          <ProfileDetailItem
            label="Address"
            value={party.address ?? 'Not provided'}
            isEditing={true}
            icon={MapPin}
          >
            <input
              type="text"
              name="address"
              value={editData.address ?? ''}
              onChange={handleInputChange}
              placeholder="Full address"
              className={commonInputClass}
            />
          </ProfileDetailItem>
        </div>
      </dl>
    ),
    risk: (
      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
            <Shield size={14} />
            Politically Exposed Person (PEP)
          </dt>
          <dd>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPEP"
                checked={editData.isPEP === true}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                This person is a Politically Exposed Person
              </span>
            </label>
            <AnimatePresence>
              {editData.isPEP && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <input
                    type="text"
                    name="pepCountry"
                    value={editData.pepCountry ?? ''}
                    onChange={handleInputChange}
                    placeholder="Country of political exposure"
                    className={commonInputClass}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </dd>
        </div>
      </dl>
    )
  };

  return (
    <InfoCard 
      title="Party Information" 
      actions={EditActions} 
      icon={User}
      priority={isEditing ? 'high' : 'normal'}
    >
      {isEditing && (
        <>
          {/* Unsaved changes indicator */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2"
              >
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  You have unsaved changes
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced tab navigation */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            {(['personal', 'contact', 'risk'] as const).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${activeTab === tab 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {validationSummary[tab]?.errors > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {validationSummary[tab].errors}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Animated tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {!isEditing && (
        <>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <ProfileDetailItem label="First Name" value={party.firstName} icon={User} />
            <ProfileDetailItem label="Last Name" value={party.lastName} icon={User} />
            <ProfileDetailItem
              label="Date of Birth"
              value={formatLocalDateTime(party.birthDate, { dateStyle: 'long', timeStyle: undefined })}
              icon={Calendar}
            />
            <ProfileDetailItem
              label="ID Type & Number"
              value={`${party.idType}: ${party.identityNo}`}
              icon={CreditCard}
            />
            <ProfileDetailItem label="Residency Status" value={party.residencyStatus} icon={MapPin} />
            <ProfileDetailItem
              label="Employment Status"
              value={party.employmentStatus ?? 'Not specified'}
              icon={Briefcase}
            />
            {party.employmentStatus === 'Employed' && party.employerName && (
              <ProfileDetailItem label="Employer Name" value={party.employerName} icon={Building} />
            )}
          </dl>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Contact Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ x: 5 }}
              >
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Email</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">
                    {party.email || 'Not provided'}
                  </dd>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ x: 5 }}
              >
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Phone</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100">
                    {party.phone || 'Not provided'}
                  </dd>
                </div>
              </motion.div>
            </dl>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Shield size={14} />
              PEP Status
            </dt>
            <dd
              className={`mt-1 inline-flex items-center gap-2 text-md font-medium ${
                party.isPEP
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {party.isPEP ? (
                <>
                  <XCircle size={16} /> Yes {party.pepCountry && `(${party.pepCountry})`}
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> No
                </>
              )}
            </dd>
          </div>
        </>
      )}
    </InfoCard>
  );
};

// Enhanced Associated Entities Card
const AssociatedEntitiesCard = ({ associations }: { associations: PartyAssociation[] }) => (
  <InfoCard title="Associated Entities" count={associations.length} icon={Building}>
    <ul className="space-y-4">
      {associations.map((a, index) => (
        <motion.li
          key={a.caseId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group"
        >
          <Link
            href={`/cases/${a.caseId}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm group-hover:shadow-md transition-shadow">
              <Building size={20} />
            </div>
            <div className="flex-grow">
              <div className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                {a.entityName}
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                  {a.entityType}
                </span>
                <span aria-hidden="true">•</span>
                <span>{a.roles.join(', ')}</span>
              </div>
            </div>
          </Link>
        </motion.li>
      ))}
    </ul>
  </InfoCard>
);

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */
export default function PartyProfileView({ details: initialDetails }: PartyProfileViewProps) {
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
  
  const { toasts, showToast } = useToast();

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

  const refreshModalDocument = async () => {
    if (!historyModalDoc) return;
    
    const updatedDetails = await getPartyDetails(party.partyId);
    if (updatedDetails) {
      setDocuments(updatedDetails.documents);
      
      // Re-filter documents for the current modal
      const documentsOfType = updatedDetails.documents.filter(d => 
        d.ownerId === party.partyId && d.documentType === historyModalDoc.documentType
      );
      
      setHistoryModalDoc({
        documentType: historyModalDoc.documentType,
        versions: documentsOfType
      });
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
      // Simulate upload progress
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

  const handleMakeCurrentDocument = async (documentId: number, document: Document) => {
    if (!associations || associations.length === 0) {
        showToast('info', 'This party is not associated with any cases.');
        return;
    }

    if (document.status !== 'Verified') {
        showToast('error', 'Only verified documents can be set as current.');
        return;
    }

    const caseNames = associations.map(a => `- ${a.entityName} (${a.caseId})`).join('\n');
    const confirmationMessage = `This will make v${document.version} of this document the current one for the following ${associations.length} associated case(s):\n\n${caseNames}\n\nDo you want to proceed?`;
    
    const isConfirmed = window.confirm(confirmationMessage);

    if (!isConfirmed) {
        return;
    }

    try {
        const updatePromises = associations.map(a =>
            updateDocumentLink(a.caseId, documentId.toString(), documentId.toString())
        );

        await Promise.all(updatePromises);

        showToast('success', `Successfully updated the document for ${associations.length} case(s).`);
        await refreshModalDocument();
    } catch (error) {
        console.error("Failed to update document links across cases:", error);
        showToast('error', 'An error occurred while updating the document for associated cases.');
    }
  };

  const handleApproveDocument = async (documentId: number) => {
    try {
      await updateDocumentStatus(documentId, 'Verified');
      await refreshModalDocument();
      showToast('success', 'Document approved successfully');
    } catch (error) {
      console.error("Failed to approve document:", error);
      showToast('error', 'Failed to approve document');
    }
  };

  const handleRejectDocument = async (documentId: number, document: Document, reason: string) => {
    try {
      await updateDocumentStatus(documentId, 'Rejected', reason);
      await refreshModalDocument();
      showToast('success', 'Document rejected');
    } catch (error) {
      console.error("Failed to reject document:", error);
      showToast('error', 'Failed to reject document');
    }
  };

  const handleScanUpload = async (doc: PartyChecklistDocument, scanDetails: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }): Promise<ScanResponse> => {
    try {
      const ownerType = 'PARTY';
      const ownerId = party.partyId;
      
      const profileName = (scanDetails.scanDetails.profile as string) || 
                         (scanDetails.scanDetails.profileName as string) || 
                         'Default Scanner';
      
      const scanRequest = {
        profileName: profileName,
        ownerType,
        ownerId,
        documentType: doc.name,
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
    // Get all versions from the document's allVersions property
    if (doc.allVersions && doc.allVersions.length > 0) {
      setHistoryModalDoc({ 
        documentType: doc.name,
        versions: doc.allVersions 
      });
    } else {
      // Fallback to filtering from all documents
      const documentsOfType = documents.filter(d => 
        d.ownerId === party.partyId && d.documentType === doc.name
      );
      
      if (documentsOfType.length > 0) {
        setHistoryModalDoc({ 
          documentType: doc.name,
          versions: documentsOfType 
        });
      } else {
        console.error('Could not find document versions for history modal');
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
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ProfileHeader party={party} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProfileDetailsCard party={party} onSave={handleSave} showToast={showToast} />
            
            <InfoCard 
              title="Document Checklist" 
              icon={FileText} 
              isLoading={isLoadingChecklist}
            >
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
                <DocumentSkeleton />
              )}
            </InfoCard>
          </div>
          
          <div className="lg:col-span-1">
            {associations && associations.length > 0 && (
              <AssociatedEntitiesCard associations={associations} />
            )}
          </div>
        </div>
        
        <DocumentHistoryModal
          isOpen={!!historyModalDoc}
          onClose={() => setHistoryModalDoc(null)}
          documentType={historyModalDoc?.documentType || ''}
          versions={historyModalDoc?.versions || []}
          onMakeCurrent={handleMakeCurrentDocument}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
          onRefresh={refreshModalDocument}
        />
        
        <DocumentPreviewModal
          isOpen={previewState.isOpen}
          onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })}
          documents={allChecklistDocs}
          startIndex={previewState.startIndex}
        />

        {/* Upload Progress */}
        <AnimatePresence>
          {uploadProgress && (
            <UploadProgress 
              fileName={uploadProgress.fileName} 
              progress={uploadProgress.progress} 
            />
          )}
        </AnimatePresence>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}