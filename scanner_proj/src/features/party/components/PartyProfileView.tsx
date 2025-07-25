// =================================================================================
// FILE: src/features/party/components/PartyProfileView.refactored.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Building,
} from 'lucide-react';

import type { Party, Document } from '@/types/entities';
import { DocStatusBadge } from '@/components/common/DocStatusBadge';
import { updateMockParty } from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';

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
  };
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS for better structure & clarity                             */
/* -------------------------------------------------------------------------- */

// A more robust and reusable card component
const InfoCard = ({
  title,
  actions,
  children,
  count,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  count?: number;
}) => (
  <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            ({count})
          </span>
        )}
      </h2>
      {actions && <div>{actions}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// Detail item for view/edit modes
const ProfileDetailItem = ({
  label,
  value,
  isEditing = false,
  children,
}: {
  label: string;
  value?: string;
  isEditing?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </dt>
    {isEditing ? (
      <dd>{children}</dd>
    ) : (
      <dd className="mt-1 text-md text-slate-900 dark:text-slate-100">
        {value || '-'}
      </dd>
    )}
  </div>
);

// Header component for the top of the page
const ProfileHeader = ({ party }: { party: Party }) => (
  <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
    <Link
      href="/cases"
      className="flex items-center gap-2 text-sm mb-4 text-blue-600 dark:text-blue-400 hover:underline"
    >
      <ChevronLeft size={16} /> Back to Cases
    </Link>
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-700 shrink-0">
        <User size={32} className="text-gray-500 dark:text-slate-300" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {party.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {party.residencyStatus} &bull; Party ID: {party.partyId}
        </p>
      </div>
    </div>
  </div>
);

// The main details card, now managing its own edit state
const ProfileDetailsCard = ({
  party,
  onSave,
}: {
  party: Party;
  onSave: (updatedParty: Party) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Party>(party);

  useEffect(() => {
    setEditData(party); // Sync with parent state if party prop changes
  }, [party]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    // Optimistically update name based on first/last
    const finalData = {
      ...editData,
      name: `${editData.firstName} ${editData.lastName}`.trim(),
    };
    await onSave(finalData);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditData(party);
    setIsEditing(false);
  };

  const commonInputClass =
    'w-full px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

  const EditActions = (
    <WithPermission permission="case:update">
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleCancelClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save size={16} /> Save
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            <Edit size={16} /> Edit
          </button>
        )}
      </div>
    </WithPermission>
  );

  return (
    <InfoCard title="Profile Details" actions={EditActions}>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <ProfileDetailItem
          label="First Name"
          value={party.firstName}
          isEditing={isEditing}
        >
          <input
            type="text"
            name="firstName"
            value={editData.firstName}
            onChange={handleInputChange}
            className={commonInputClass}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Last Name"
          value={party.lastName}
          isEditing={isEditing}
        >
          <input
            type="text"
            name="lastName"
            value={editData.lastName}
            onChange={handleInputChange}
            className={commonInputClass}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Date of Birth"
          value={party.birthDate}
          isEditing={isEditing}
        >
          <input
            type="date" // Use type="date" for better UX
            name="birthDate"
            value={editData.birthDate}
            onChange={handleInputChange}
            className={commonInputClass}
          />
        </ProfileDetailItem>

        <ProfileDetailItem
          label="Residency Status"
          value={party.residencyStatus}
          isEditing={isEditing}
        >
          <select
            name="residencyStatus"
            value={editData.residencyStatus}
            onChange={handleInputChange}
            className={commonInputClass}
          >
            <option>Singaporean/PR</option>
            <option>Foreigner</option>
          </select>
        </ProfileDetailItem>

        {/* PEP Status is not editable in this design, so it stays outside the grid */}
        <div className="md:col-span-2">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Politically Exposed Person (PEP)
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
                <XCircle size={16} /> Yes ({party.pepCountry})
              </>
            ) : (
              <>
                <CheckCircle size={16} /> No
              </>
            )}
          </dd>
        </div>
      </dl>
    </InfoCard>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */
export default function PartyProfileView({ details }: PartyProfileViewProps) {
  const { party: initialParty, documents, associations } = details;
  const [party, setParty] = useState<Party>(initialParty);

  useEffect(() => {
    setParty(initialParty);
  }, [initialParty]);

  const handleSave = async (updatedData: Party) => {
    const updatedParty = await updateMockParty(updatedData);
    if (updatedParty) {
      setParty(updatedParty);
    }
    // Consider adding error handling here (e.g., a toast notification)
  };

  return (
    <div className="space-y-6">
      <ProfileHeader party={party} />

      {/* ======================= LAYOUT GRID ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ----- MAIN CONTENT (LEFT) ----- */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileDetailsCard party={party} onSave={handleSave} />

          {associations.length > 0 && (
            <InfoCard title="Associated Entities" count={associations.length}>
              <ul className="space-y-4">
                {associations.map(a => (
                  <li key={a.caseId} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                      <Building size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-grow">
                      <Link
                        href={`/cases/${a.caseId}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {a.entityName}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{a.entityType}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{a.roles.join(', ')}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}
        </div>

        {/* ----- SIDEBAR (RIGHT) ----- */}
        <div className="lg:col-span-1">
          <InfoCard title="Master Documents" count={documents.length}>
            <div className="space-y-2">
              {documents.length > 0 ? (
                documents.map(doc => {
                  const latest = doc.versions[doc.versions.length - 1];
                  return (
                    <div
                      key={doc.documentId}
                      className="p-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div className="text-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {doc.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Version {latest.version}
                          </p>
                        </div>
                      </div>
                      <DocStatusBadge status={latest.status} />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-center py-4 text-slate-500 dark:text-slate-400">
                  No documents found.
                </p>
              )}
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}