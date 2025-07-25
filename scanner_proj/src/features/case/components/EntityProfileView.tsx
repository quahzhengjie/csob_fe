// =================================================================================
// FILE: src/features/case/components/EntityProfileView.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import type { Case } from '@/types/entities';
import { WithPermission } from '@/features/rbac/WithPermission';
import { Edit, Save, X } from 'lucide-react';

interface EntityProfileViewProps {
  entity: Case['entity'];
  onUpdate: (entityData: Case['entity']) => void;
}

// A generic helper for form fields
const FormField = ({ label, name, value, isEditing, onChange }: { label: string, name: keyof Case['entity'], value?: string | null, isEditing: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
    {isEditing ? (
      <input
        type="text"
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600"
      />
    ) : (
      <p className="mt-1 text-md font-medium text-slate-900 dark:text-slate-100">{value || '-'}</p>
    )}
  </div>
);

export function EntityProfileView({ entity, onUpdate }: EntityProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(entity);

  // Effect to update the form data if the source entity prop changes
  useEffect(() => {
    setEditData(entity);
  }, [entity]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditData(entity);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Entity Information</h3>
        <WithPermission permission="case:update">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"><X size={16} /> Cancel</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"><Save size={16} /> Save</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"><Edit size={16} /> Edit</button>
            )}
          </div>
        </WithPermission>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
        <FormField label="Legal Name" name="entityName" value={editData.entityName} isEditing={isEditing} onChange={handleInputChange} />
        {/* Entity Type is not editable */}
        <FormField label="Entity Type" name="entityType" value={editData.entityType} isEditing={false} onChange={handleInputChange} />
        <FormField label="Tax ID / UEN" name="taxId" value={editData.taxId} isEditing={isEditing} onChange={handleInputChange} />
        <FormField label="Address Line 1" name="address1" value={editData.address1} isEditing={isEditing} onChange={handleInputChange} />
        <FormField label="Address Line 2" name="address2" value={editData.address2} isEditing={isEditing} onChange={handleInputChange} />
        <FormField label="Country" name="addressCountry" value={editData.addressCountry} isEditing={isEditing} onChange={handleInputChange} />
        <FormField label="Place of Incorporation" name="placeOfIncorporation" value={editData.placeOfIncorporation} isEditing={isEditing} onChange={handleInputChange} />
        <FormField label="FATCA Classification" name="usFatcaClassificationFinal" value={editData.usFatcaClassificationFinal} isEditing={isEditing} onChange={handleInputChange} />
      </div>
    </div>
  );
}