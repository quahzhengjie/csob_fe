// =================================================================================
// FILE: src/features/case/components/CaseDetailView.tsx
// =================================================================================
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit, UserPlus } from 'lucide-react';
import type { Case, Party, Document, CaseDocumentLink, ScannerProfile, NewPartyData, DocumentVersion, CallReport } from '@/types/entities';
import type { CaseStatus, RiskLevel } from '@/types/enums';
import { assignMockCase, updateMockCase, addActivityLog, updateMockEntity, addMockCallReport } from '@/lib/apiClient';
import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';
import { generateLiveChecklist, type ChecklistDocument } from '../utils/checklist';
import { DocumentChecklist } from './DocumentChecklist';
import { PartyList } from './PartyList';
import AddPartyModal from './AddPartyModal';
import { DocumentHistoryModal } from './DocumentHistoryModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { CaseOverview } from './CaseOverview';
import { WorkflowProgress } from './WorkflowProgress';
import { AssignCaseModal } from './AssignCaseModal';
import { UpdateCaseModal } from './UpdateCaseModal';
import { ActivityLogView } from './ActivityLogView';
import { EntityProfileView } from './EntityProfileView';
import { CreditDetailsView } from './CreditDetailsView';
import { CallReportsView } from './CallReportsView';
import { AdHocDocumentsView } from './AdHocDocumentsView';
import {AccountDocumentChecklist} from './AccountDocumentChecklist'

interface CaseDetailViewProps {
  details: {
    caseData: Case;
    parties: Party[];
    documents: Document[];
    documentLinks: CaseDocumentLink[];
    scannerProfiles: ScannerProfile[];
    allParties: Party[];
    allUsers: { userId: string, name: string }[];
  }
}

type CaseDetailTab = 'checklist'| 'account' | 'entity_profile' | 'credit_details' | 'call_reports' | 'ad_hoc' | 'activity_log';

export default function CaseDetailView({ details: initialDetails }: CaseDetailViewProps) {
  const [details, setDetails] = useState(initialDetails);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [historyModalDoc, setHistoryModalDoc] = useState<{doc: Document, currentVersionId?: string} | null>(null);
  const [activeTab, setActiveTab] = useState<CaseDetailTab>('checklist');
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { caseData, parties, documents, documentLinks, scannerProfiles, allParties, allUsers } = details;

  const { checklist, progress } = useMemo(() =>
    generateLiveChecklist(caseData, parties, documents, documentLinks),
    [caseData, parties, documents, documentLinks]
  );
  
  const allChecklistDocs = useMemo(() =>
    checklist.flatMap(section => section.documents).filter(doc => doc.status !== 'Missing'),
  [checklist]);

  const logAndUpdateState = async (type: string, logDetails: string) => {
    const updatedCase = await addActivityLog(caseData.caseId, { type, details: logDetails, performedBy: 'USER-001' });
    if (updatedCase) {
        setDetails(prev => ({ ...prev, caseData: updatedCase }));
    }
  };

  const handleLinkDocument = async (docToLink: ChecklistDocument) => {
    if (!docToLink.reusableDocument) return;
    const newLink: CaseDocumentLink = {
        linkId: `LNK-${crypto.randomUUID()}`, caseId: caseData.caseId,
        documentId: docToLink.reusableDocument.documentId, versionId: docToLink.reusableDocument.versionId, status: 'Verified', comments: 'Linked from existing master document.'
    };
    setDetails(current => ({ ...current, documentLinks: [...current.documentLinks, newLink] }));
    await logAndUpdateState('document_linked', `Linked document: ${docToLink.name}`);
  };

  const handleSaveUpload = async (doc: ChecklistDocument, uploadDetails: { expiryDate: string, comments: string }) => {
    const newDocId = `DOC-${crypto.randomUUID()}`;
    const newVersionId = `v1-${crypto.randomUUID()}`;
    const newDoc: Document = {
        documentId: newDocId, ownerId: doc.ownerId, name: doc.name,
        versions: [{
            id: newVersionId, version: 1, status: 'Submitted', uploadedDate: new Date().toISOString(), fileRef: '/path/to/new_upload.pdf', mimeType: 'application/pdf', ...uploadDetails
        }]
    };
    const newLink: CaseDocumentLink = {
        linkId: `LNK-${crypto.randomUUID()}`, caseId: caseData.caseId, documentId: newDocId, versionId: newVersionId, status: 'Submitted',
    };
    setDetails(current => ({ ...current, documents: [...current.documents, newDoc], documentLinks: [...current.documentLinks, newLink] }));
    await logAndUpdateState('document_uploaded', `Uploaded document: ${doc.name}`);
  };

  const handleScanUpload = async (doc: ChecklistDocument, scanDetails: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }) => {
    await handleSaveUpload(doc, scanDetails);
    await logAndUpdateState('document_scanned', `Scanned document: ${doc.name}`);
  };

  const handleAddNewParty = async (partyData: NewPartyData) => {
    const isNew = !partyData.partyId;
    const newPartyId = isNew ? `PARTY-${crypto.randomUUID()}` : partyData.partyId!;
    setDetails(current => {
        let newParties = current.parties;
        if (isNew && partyData.name) {
            const nameParts = partyData.name.split(' ');
            const newPartyRecord: Party = {
                partyId: newPartyId, name: partyData.name, residencyStatus: partyData.residencyStatus || 'Singaporean/PR',
                firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '',
                idType: 'TBC', identityNo: 'TBC', birthDate: 'TBC', isPEP: false,
            };
            newParties = [...current.parties, newPartyRecord];
        }
        const newCaseData = { ...current.caseData, relatedPartyLinks: [...current.caseData.relatedPartyLinks, { partyId: newPartyId, relationships: partyData.relationships }] };
        return { ...current, caseData: newCaseData, parties: newParties };
    });
    setIsPartyModalOpen(false);
    await logAndUpdateState('party_added', `Added related party: ${partyData.name || 'existing party'}`);
  };

  const handleShowHistory = (doc: ChecklistDocument) => {
    const fullDoc = documents.find(d => d.documentId === doc.masterDocumentId);
    if (fullDoc) { setHistoryModalDoc({ doc: fullDoc, currentVersionId: doc.id }); }
  };

  const handleRevertDocument = async (documentId: string, version: DocumentVersion) => {
    setDetails(current => ({
      ...current,
      documentLinks: current.documentLinks.map(link => link.documentId === documentId ? { ...link, versionId: version.id, status: version.status } : link)
    }));
    setHistoryModalDoc(null);
    const doc = documents.find(d => d.documentId === documentId);
    await logAndUpdateState('document_reverted', `Reverted document ${doc?.name} to v${version.version}`);
  };

  const handlePreviewDocument = (doc: ChecklistDocument) => {
    if (doc.status === 'Missing') return;
    const docIndex = allChecklistDocs.findIndex(d => d.id === doc.id && d.name === doc.name);
    if (docIndex !== -1) {
      setPreviewState({ isOpen: true, startIndex: docIndex });
    }
  };

  const handleAssignCase = async (userId: string, note: string) => {
    const updatedCase = await assignMockCase(caseData.caseId, userId);
    const user = allUsers.find(u => u.userId === userId);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('case_assigned', `Assigned case to ${user?.name}.${note ? ` Note: ${note}` : ''}`);
    }
    setIsAssignModalOpen(false);
  };

  const handleUpdateCase = async (updates: { status: CaseStatus, riskLevel: RiskLevel }) => {
    const updatedCase = await updateMockCase(caseData.caseId, updates);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('case_updated', `Updated status to ${updates.status} and risk to ${updates.riskLevel}`);
    }
    setIsUpdateModalOpen(false);
  };

  const handleUpdateEntity = async (entityData: Case['entity']) => {
    const updatedCase = await updateMockEntity(caseData.caseId, entityData);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('entity_updated', `Updated entity profile.`);
    }
  };

  const handleAddCallReport = async (reportData: Omit<CallReport, 'reportId'>) => {
    const updatedCase = await addMockCallReport(caseData.caseId, reportData);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('call_report_added', `Added a new call report.`);
    }
  };

  const TabButton = ({ tabId, label }: { tabId: CaseDetailTab, label: string }) => (
      <button onClick={() => setActiveTab(tabId)} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${ activeTab === tabId ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300' }`} >{label}</button>
  );

  const docHandlerProps = { onLinkDocument: handleLinkDocument, onUploadDocument: handleSaveUpload, onScan: handleScanUpload, onShowHistory: handleShowHistory, onPreview: handlePreviewDocument };

  return (
    <>
      <AddPartyModal isOpen={isPartyModalOpen} onClose={() => setIsPartyModalOpen(false)} onAddParty={handleAddNewParty} masterIndividuals={allParties} entityType={caseData.entity.entityType} />
      <DocumentHistoryModal isOpen={!!historyModalDoc} onClose={() => setHistoryModalDoc(null)} document={historyModalDoc?.doc ?? null} currentVersionId={historyModalDoc?.currentVersionId} onRevert={handleRevertDocument} />
      <DocumentPreviewModal isOpen={previewState.isOpen} onClose={() => setPreviewState({ isOpen: false, startIndex: 0 })} documents={allChecklistDocs} startIndex={previewState.startIndex} />
      <AssignCaseModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onAssign={handleAssignCase} users={allUsers} currentAssigneeId={caseData.assignedTo} />
      <UpdateCaseModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} onUpdate={handleUpdateCase} currentStatus={caseData.status} currentRiskLevel={caseData.riskLevel} />
      
      <div className="space-y-8">
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/cases" className="flex items-center gap-2 text-sm mb-4 text-blue-600 dark:text-blue-400 hover:underline"> <ChevronLeft size={16} /> Back to Cases </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{caseData.entity.entityName}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{caseData.entity.entityType} &bull; Case ID: {caseData.caseId}</p>
              {caseData.assignedTo && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assigned to: {allUsers.find(u => u.userId === caseData.assignedTo)?.name || caseData.assignedTo}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2"> <StatusBadge status={caseData.status} /> <RiskBadge level={caseData.riskLevel} /> </div>
              <div className="flex gap-2 mt-2 text-xs">
                <WithPermission permission="case:update"><button onClick={() => setIsAssignModalOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><UserPlus size={12} /> Assign</button></WithPermission>
                <WithPermission permission="case:update"><button onClick={() => setIsUpdateModalOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"><Edit size={12} /> Update Case</button></WithPermission>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Workflow Progress</h3>
          <WorkflowProgress currentStageId={caseData.workflowStage} />
        </div>
        <CaseOverview progress={progress} />
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="flex -mb-px px-6 overflow-x-auto">
                    <TabButton tabId="checklist" label="Checklist" />
                    <TabButton tabId= "account" label= "Accounts"/>
                    <TabButton tabId="entity_profile" label="Entity Profile" />
                    <TabButton tabId="credit_details" label="Credit Details" />
                    <TabButton tabId="call_reports" label="Call Reports" />
                    <TabButton tabId="ad_hoc" label="Ad-Hoc Docs" />
                    <TabButton tabId="activity_log" label="Activity" />
                </nav>
            </div>
            <div className="p-6">
                {activeTab === 'checklist' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <PartyList caseData={caseData} parties={parties} onAddParty={() => setIsPartyModalOpen(true)} />
                        </div>
                        <div className="lg:col-span-2">
                            <DocumentChecklist
                              caseData={caseData} parties={parties} documents={documents} documentLinks={documentLinks}
                              scannerProfiles={scannerProfiles} {...docHandlerProps}
                            />
                        </div>
                    </div>
                )}
             {activeTab === 'account' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <PartyList caseData={caseData} parties={parties} onAddParty={() => setIsPartyModalOpen(true)} />
                        </div>
                        <div className="lg:col-span-2">
                            <AccountDocumentChecklist
                              caseData={caseData} parties={parties} documents={documents} documentLinks={documentLinks}
                              scannerProfiles={scannerProfiles} {...docHandlerProps}
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'entity_profile' && <EntityProfileView entity={caseData.entity} onUpdate={handleUpdateEntity} /> }
                {activeTab === 'credit_details' && <CreditDetailsView caseData={caseData} scannerProfiles={scannerProfiles} {...docHandlerProps} /> }
                {activeTab === 'call_reports' && <CallReportsView reports={caseData.callReports} onAddReport={handleAddCallReport} /> }
                {activeTab === 'ad_hoc' && <AdHocDocumentsView scannerProfiles={scannerProfiles} {...docHandlerProps} /> }
                {activeTab === 'activity_log' && <ActivityLogView activities={caseData.activities} users={allUsers} /> }
            </div>
        </div>
      </div>
    </>
  );
}