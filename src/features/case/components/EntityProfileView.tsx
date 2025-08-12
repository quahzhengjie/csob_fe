// =================================================================================
// FILE: src/features/case/components/EntityProfileView.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import type { Case } from '@/types/entities';
import { WithPermission } from '@/features/rbac/WithPermission';
import { updateEntityData } from '@/lib/apiClient';
import { 
  Edit, Save, X, Building2, FileText, MapPin, 
  Phone, Mail, Hash, DollarSign, User 
} from 'lucide-react';

interface EntityProfileViewProps {
  entity: Case['entity'];
  caseId: string;
  onUpdate?: (entityData: Case['entity']) => void;
}

// Extend the entity type to include additional UI-only fields
interface ExtendedEntity {
  customerId: string;
  entityName: string;
  entityType: string;
  basicNumber?: string | null;
  cisNumber?: string | null;
  taxId: string;
  address1: string;
  address2?: string;
  addressCountry: string;
  placeOfIncorporation: string;
  usFatcaClassificationFinal: string;
  creditDetails?: {
    creditLimit: number;
    creditScore: string;
    assessmentNotes: string;
  };
  // Additional UI-only fields
  businessActivity?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Enhanced form field component with icons and better styling
const FormField = ({ 
  label, 
  name, 
  value, 
  isEditing, 
  onChange, 
  icon: Icon,
  type = 'text',
  required = false,
  placeholder = '',
  helperText = ''
}: { 
  label: string;
  name: string;
  value?: string | null | number;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  icon?: React.ElementType;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
      {Icon && <Icon size={16} className="text-slate-400" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {isEditing ? (
      <>
        <input
          type={type}
          id={name}
          name={name}
          value={value?.toString() || ''}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </>
    ) : (
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {value?.toString() || <span className="text-slate-400 italic">Not provided</span>}
      </p>
    )}
  </div>
);

// Text area component for longer text
const TextAreaField = ({ 
  label, 
  name, 
  value, 
  isEditing, 
  onChange,
  rows = 3,
  placeholder = ''
}: { 
  label: string;
  name: string;
  value?: string | null;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-400">
      {label}
    </label>
    {isEditing ? (
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    ) : (
      <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </p>
    )}
  </div>
);

export function EntityProfileView({ entity, caseId, onUpdate }: EntityProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ExtendedEntity>(entity);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'contact' | 'credit'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditData(entity);
  }, [entity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreditDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      creditDetails: {
        creditLimit: prev.creditDetails?.creditLimit || 0,
        creditScore: prev.creditDetails?.creditScore || '',
        assessmentNotes: prev.creditDetails?.assessmentNotes || '',
        ...prev.creditDetails,
        [name]: name === 'creditLimit' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Extract only the fields that belong to Case['entity'] for the API call
      const entityData: Case['entity'] = {
        customerId: editData.customerId,
        entityName: editData.entityName,
        entityType: editData.entityType,
        basicNumber: editData.basicNumber,
        cisNumber: editData.cisNumber,
        taxId: editData.taxId,
        address1: editData.address1,
        address2: editData.address2,
        addressCountry: editData.addressCountry,
        placeOfIncorporation: editData.placeOfIncorporation,
        usFatcaClassificationFinal: editData.usFatcaClassificationFinal,
        creditDetails: editData.creditDetails,
      businessActivity: editData.businessActivity,
      contactPerson: editData.contactPerson,
      contactEmail: editData.contactEmail,
      contactPhone: editData.contactPhone
      };
      
      // Call the API to update entity data
      const updatedCase = await updateEntityData(caseId, entityData);
      
      // Call the callback if provided
      if (onUpdate) {
        onUpdate(updatedCase.entity);
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update entity:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditData(entity);
    setIsEditing(false);
    setError(null);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: Building2 },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'credit', label: 'Credit Details', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Entity Profile</h3>
        <WithPermission permission="case:update">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel} 
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
                  disabled={isSaving}
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        </WithPermission>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'basic' | 'address' | 'contact' | 'credit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField 
              label="Legal Name" 
              name="entityName" 
              value={editData.entityName} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={Building2}
              required
            />
            
            <FormField 
              label="Entity Type" 
              name="entityType" 
              value={editData.entityType} 
              isEditing={false} 
              onChange={handleInputChange}
              icon={FileText}
              helperText="Entity type cannot be changed after creation"
            />
            
            <FormField 
              label="Basic Number (BN)" 
              name="basicNumber" 
              value={editData.basicNumber} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={Hash}
              required
              placeholder="e.g., 123456"
              helperText="6-digit company registration number"
            />
            
            <FormField 
              label="Customer ID" 
              name="customerId" 
              value={editData.customerId} 
              isEditing={false} 
              onChange={handleInputChange}
              helperText="System-generated identifier"
            />
            
            <FormField 
              label="CIS Number" 
              name="cisNumber" 
              value={editData.cisNumber} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              placeholder="Optional"
            />
            
            <FormField 
              label="Tax ID / GST Number" 
              name="taxId" 
              value={editData.taxId} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={FileText}
              required
            />
            
            <FormField 
              label="FATCA Classification" 
              name="usFatcaClassificationFinal" 
              value={editData.usFatcaClassificationFinal} 
              isEditing={isEditing} 
              onChange={handleInputChange}
            />
            
            <div className="md:col-span-2 lg:col-span-3">
              <TextAreaField
                label="Business Activity"
                name="businessActivity"
                value={editData.businessActivity}
                isEditing={isEditing}
                onChange={handleInputChange}
                placeholder="Describe the primary business activities"
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Address Line 1" 
              name="address1" 
              value={editData.address1} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={MapPin}
              required
              placeholder="Street address"
            />
            
            <FormField 
              label="Address Line 2" 
              name="address2" 
              value={editData.address2} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              placeholder="Unit/Suite number (Optional)"
            />
            
            <FormField 
              label="Country" 
              name="addressCountry" 
              value={editData.addressCountry} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              required
            />
            
            <FormField 
              label="Place of Incorporation" 
              name="placeOfIncorporation" 
              value={editData.placeOfIncorporation} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Contact Person" 
              name="contactPerson" 
              value={editData.contactPerson} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={User}
              placeholder="Primary contact name"
            />
            
            <FormField 
              label="Contact Email" 
              name="contactEmail" 
              value={editData.contactEmail} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={Mail}
              type="email"
              placeholder="contact@company.com"
            />
            
            <FormField 
              label="Contact Phone" 
              name="contactPhone" 
              value={editData.contactPhone} 
              isEditing={isEditing} 
              onChange={handleInputChange}
              icon={Phone}
              type="tel"
              placeholder="+65 1234 5678"
            />
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="space-y-6">
            {editData.creditDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Credit Limit" 
                  name="creditLimit" 
                  value={editData.creditDetails.creditLimit} 
                  isEditing={isEditing} 
                  onChange={handleCreditDetailsChange}
                  icon={DollarSign}
                  type="number"
                  placeholder="0.00"
                />
                
                <FormField 
                  label="Credit Score" 
                  name="creditScore" 
                  value={editData.creditDetails.creditScore} 
                  isEditing={isEditing} 
                  onChange={handleCreditDetailsChange}
                  placeholder="e.g., AAA, BB+"
                />
                
                <div className="md:col-span-2">
                  <TextAreaField
                    label="Assessment Notes"
                    name="assessmentNotes"
                    value={editData.creditDetails.assessmentNotes}
                    isEditing={isEditing}
                    onChange={handleCreditDetailsChange}
                    placeholder="Credit assessment details and notes"
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No credit details available</p>
                {isEditing && (
                  <button
                    onClick={() => setEditData(prev => ({
                      ...prev,
                      creditDetails: {
                        creditLimit: 0,
                        creditScore: '',
                        assessmentNotes: ''
                      }
                    }))}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Add Credit Details
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      {!isEditing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Some fields like Basic Number and Tax ID are critical for compliance. 
            Ensure all required information is accurate and up-to-date.
          </p>
        </div>
      )}
    </div>
  );
}