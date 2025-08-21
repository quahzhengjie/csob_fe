// =================================================================================
// CLEANED UP: src/features/case/components/CaseDetailView.tsx
// Removed unused CaseDocumentLink and linkId generation that caused hydration errors
// =================================================================================

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit, UserPlus, AlertTriangle } from 'lucide-react';
import type { Case, Party, Document, ScannerProfile, NewPartyData, CallReport, CaseStatus, RiskLevel } from '@/types/entities';
import { 
  assignCase, 
  updateCaseStatus, 
  addActivityLog, 
  updateEntityData, 
  addCallReport, 
  uploadDocument, 
  triggerScan, 
  getCaseDetails, 
  updateDocumentStatus, 
  updateDocumentLink, 
  updateCallReport, 
  deleteCallReport, 
  addRelatedParty, 
  createParty, 
  updatePartyRelationships, 
  removePartyFromCase 
} from '@/lib/apiClient';
import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';
import { useAuth } from '@/context/AuthContext';
import { generateLiveChecklist, type ChecklistDocument, type ChecklistSection } from '../utils/checklist';
import { determineExceptionStatus, getExceptionReason } from '../utils/exceptionRules';
import { DocumentChecklist } from './DocumentChecklist';
import { PartyList } from './PartyList';
import AddPartyModal from './AddPartyModal';
import EditPartyModal from './EditPartyModal';
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

interface CaseDetailViewProps {
  details: {
    caseData: Case;
    parties: Party[];
    documents: Document[];
    scannerProfiles: ScannerProfile[];
    allParties: Party[];
    allUsers: { userId: string, name: string }[];
  }
}

interface EditPartyData {
  partyId: string;
  name: string;
  relationships: { type: string; ownershipPercentage?: number }[];
}

type CaseDetailTab = 'checklist' | 'entity_profile' | 'credit_details' | 'call_reports' | 'ad_hoc' | 'activity_log';

export default function CaseDetailView({ details: initialDetails }: CaseDetailViewProps) {
  const [details, setDetails] = useState(initialDetails);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isEditPartyModalOpen, setIsEditPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<EditPartyData | null>(null);
  const [historyModalDoc, setHistoryModalDoc] = useState<{
    documentType: string;
    versions: Document[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<CaseDetailTab>('checklist');
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // GET THE CURRENT USER
  const { user } = useAuth();

  // State for async checklist data
  const [checklistData, setChecklistData] = useState<{
    checklist: ChecklistSection[];
    progress: { percentage: number; missingDocs: ChecklistDocument[] };
  }>({ checklist: [], progress: { percentage: 0, missingDocs: [] } });
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);

  const { caseData, parties, documents, scannerProfiles, allParties, allUsers } = details;

  const existingPartyIds = useMemo(() => 
    caseData.relatedPartyLinks.map(link => link.partyId),
    [caseData.relatedPartyLinks]
  );

  // Determine if this is an exception case
  const isException = determineExceptionStatus(caseData);
  const exceptionReason = getExceptionReason(caseData);

  // Load checklist data asynchronously
  useEffect(() => {
    const loadChecklist = async () => {
      setIsLoadingChecklist(true);
      try {
        const result = await generateLiveChecklist(
          caseData,
          parties,
          documents,
          isException
        );
        setChecklistData(result);
      } catch (error) {
        console.error('Failed to generate checklist:', error);
      } finally {
        setIsLoadingChecklist(false);
      }
    };

    loadChecklist();
  }, [caseData, parties, documents, isException]);

  const allChecklistDocs = useMemo(() =>
    checklistData.checklist.flatMap(section => section.documents).filter(doc => doc.status !== 'Missing'),
  [checklistData.checklist]);

  // Log activity and update state
  const logAndUpdateState = async (type: string, logDetails: string) => {
    // Use the actual user ID, fallback to username, or 'SYSTEM' if neither available
    const performedBy = user?.userId || user?.username || 'SYSTEM';
    
    const updatedCase = await addActivityLog(caseData.caseId, { 
      type, 
      details: logDetails, 
      performedBy 
    });
    
    if (updatedCase) {
        setDetails(prev => ({ ...prev, caseData: updatedCase }));
    }
  };

  // CLEANED UP: Removed unused linkId generation - backend doesn't support document linking
  const handleLinkDocument = async (docToLink: ChecklistDocument) => {
    // Document linking is not supported by the backend
    // The backend associates documents directly with cases/parties via ownerType and ownerId
    // If you need this functionality, implement a backend endpoint first
    
    console.warn('Document linking is not implemented in the backend');
    alert('Document linking functionality is not available. Please upload the document directly.');
    
    // Just log the attempt for now
    await logAndUpdateState('document_link_attempted', `Attempted to link document: ${docToLink.name}`);
  };

  const handleSaveUpload = async (doc: ChecklistDocument, uploadDetails: { expiryDate: string, comments: string, file?: File }) => {
    try {
      const isPartyDoc = parties.some(p => p.partyId === doc.ownerId);
      const ownerType = isPartyDoc ? 'PARTY' : 'CASE';
      const ownerId = isPartyDoc ? doc.ownerId : caseData.caseId;

      if (uploadDetails.file) {
        await uploadDocument(
          ownerId,
          ownerType,
          doc.name,
          uploadDetails.file,
          {
            expiryDate: uploadDetails.expiryDate,
            comments: uploadDetails.comments,
            isAdHoc: doc.isAdHoc
          }
        );

        const updatedDetails = await getCaseDetails(caseData.caseId);
        if (updatedDetails) {
          setDetails(updatedDetails);
          await logAndUpdateState('document_uploaded', `Uploaded document: ${doc.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const handleScanUpload = async (doc: ChecklistDocument, scanDetails: { expiryDate: string, comments: string, scanDetails: Record<string, unknown> }): Promise<{ documentId?: string; status?: string; message?: string }> => {
    try {
      const isPartyDoc = parties.some(p => p.partyId === doc.ownerId);
      const ownerType = isPartyDoc ? 'PARTY' : 'CASE';
      const ownerId = isPartyDoc ? doc.ownerId : caseData.caseId;

      const profileName = (scanDetails.scanDetails.profile as string) || (scanDetails.scanDetails.profileName as string) || 'Default Scanner';
      const source = (scanDetails.scanDetails.source as string) || 'feeder';

      const scanRequest = {
        profileName,
        ownerType,
        ownerId,
        documentType: doc.name,
        source: source,
        format: (scanDetails.scanDetails.format as string) || 'pdf'
      };

      const scanResult = await triggerScan(scanRequest);

      if (scanResult.documentId) {
        const updatedDetails = await getCaseDetails(caseData.caseId);
        if (updatedDetails) {
          setDetails(updatedDetails);
        }
        await logAndUpdateState('document_scanned', `Scanned document: ${doc.name}`);
      }
      return scanResult;
    } catch (error) {
      console.error('Failed to scan document:', error);
      if (error instanceof Error && error.message.includes('500')) {
        alert('Scanner not available. Please ensure the scanner is connected and powered on, or use the upload option instead.');
      } else {
        alert('Failed to scan document. Please try again.');
      }
      throw error;
    }
  };

  const handleAddNewParty = async (partyData: NewPartyData) => {
    try {
      const isNew = !partyData.partyId;
      let finalPartyId: string;
      let partyName: string;

      if (isNew && partyData.name) {
        const newPartyData: Omit<Party, 'partyId'> = {
          name: partyData.name,
          firstName: partyData.firstName || partyData.name.split(' ')[0] || '',
          lastName: partyData.lastName || partyData.name.split(' ').slice(1).join(' ') || '',
          residencyStatus: partyData.residencyStatus || 'Singaporean/PR',
          idType: partyData.idType || 'NRIC',
          identityNo: partyData.identityNo || 'Pending',
          birthDate: partyData.birthDate || '1990-01-01',
          isPEP: false,
          pepCountry: undefined,
        };
        
        // Backend generates the party ID
        const createdParty = await createParty(newPartyData);
        finalPartyId = createdParty.partyId;
        partyName = createdParty.name;
        
        setDetails(current => ({ 
          ...current, 
          parties: [...current.parties, createdParty], 
          allParties: [...current.allParties, createdParty] 
        }));
      } else {
        finalPartyId = partyData.partyId!;
        const existingParty = details.allParties.find(p => p.partyId === finalPartyId);
        partyName = existingParty?.name || 'Unknown Party';
      }

      for (const relationship of partyData.relationships) {
        await addRelatedParty(caseData.caseId, {
          partyId: finalPartyId,
          name: partyName,
          relationshipType: relationship.type,
          ownershipPercentage: relationship.ownershipPercentage
        });
      }

      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        setDetails(updatedDetails);
      }
      setIsPartyModalOpen(false);
      await logAndUpdateState('party_added', `Added related party: ${partyName} as ${partyData.relationships.map(r => r.type).join(', ')}`);
    } catch (error) {
      console.error('Failed to add party:', error);
      alert('Failed to add party. Please try again.');
    }
  };

  // Party editing handlers
  const handleEditParty = (partyId: string, name: string, relationships: { type: string; ownershipPercentage?: number }[]) => {
    setEditingParty({
      partyId,
      name,
      relationships
    });
    setIsEditPartyModalOpen(true);
  };

  const handleUpdateParty = async (partyId: string, relationships: { type: string; ownershipPercentage?: number }[]) => {
    try {
      await updatePartyRelationships(caseData.caseId, partyId, relationships);
      
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        setDetails(updatedDetails);
      }
      
      setIsEditPartyModalOpen(false);
      setEditingParty(null);
      
      const partyName = editingParty?.name || 'Unknown Party';
      await logAndUpdateState('party_updated', `Updated roles for ${partyName}: ${relationships.map(r => r.type).join(', ')}`);
    } catch (error) {
      console.error('Failed to update party:', error);
      alert('Failed to update party. Please try again.');
    }
  };

  const handleRemoveParty = async (partyId: string, partyName?: string) => {
    try {
      await removePartyFromCase(caseData.caseId, partyId);
      
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        setDetails(updatedDetails);
      }
      
      setIsEditPartyModalOpen(false);
      setEditingParty(null);
      
      const finalPartyName = partyName || editingParty?.name || 'Unknown Party';
      await logAndUpdateState('party_removed', `Removed party: ${finalPartyName}`);
    } catch (error) {
      console.error('Failed to remove party:', error);
      alert('Failed to remove party. Please try again.');
    }
  };

  // Document and modal handlers
  const handleShowHistory = (doc: ChecklistDocument) => {
    const isPartyDoc = parties.some(p => p.partyId === doc.ownerId);
    const ownerIdToFind = isPartyDoc ? doc.ownerId : caseData.caseId;
    
    // Find all documents of this type for this owner
    const documentsOfType = documents.filter(d => 
      d.ownerId === ownerIdToFind && d.documentType === doc.name
    );
    
    if (documentsOfType.length > 0) {
      setHistoryModalDoc({ 
        documentType: doc.name,
        versions: documentsOfType 
      });
    } else {
      console.error('Could not find document for history modal');
      alert('Unable to load document history. Please refresh and try again.');
    }
  };
  
  const refreshModalDocument = async () => {
    if (!historyModalDoc) return;
    
    const updatedDetails = await getCaseDetails(caseData.caseId);
    if (updatedDetails) {
      setDetails(updatedDetails);
      
      // Re-filter documents for the current modal
      const isPartyDoc = parties.some(p => 
        updatedDetails.documents.some(d => 
          d.documentType === historyModalDoc.documentType && d.ownerId === p.partyId
        )
      );
      const ownerIdToFind = isPartyDoc 
        ? updatedDetails.documents.find(d => d.documentType === historyModalDoc.documentType)?.ownerId 
        : caseData.caseId;
      
      if (ownerIdToFind) {
        const documentsOfType = updatedDetails.documents.filter(d => 
          d.ownerId === ownerIdToFind && d.documentType === historyModalDoc.documentType
        );
        
        setHistoryModalDoc({
          documentType: historyModalDoc.documentType,
          versions: documentsOfType
        });
      }
    }
  };

  const handleMakeCurrentDocument = async (documentId: number, document: Document) => {
    try {
      if (document.status !== 'Verified') {
        alert('Only Verified documents can be made current.');
        return;
      }
      if (document.isCurrentForCase) {
        alert('This version is already the current version.');
        return;
      }
      
      await updateDocumentLink(caseData.caseId, documentId.toString(), documentId.toString());
      
      await refreshModalDocument();
      await logAndUpdateState('document_made_current', `Updated document version to v${document.version}`);
      alert('Document version updated successfully!');
    } catch (error) {
      alert(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleApproveDocument = async (documentId: number, document: Document) => {
    try {
      await updateDocumentStatus(documentId, 'Verified');
      await refreshModalDocument();
      await logAndUpdateState('document_approved', `Approved document version: ${document.version}`);
    } catch (error) {
      alert(`Failed to approve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRejectDocument = async (documentId: number, document: Document, reason: string) => {
    try {
      await updateDocumentStatus(documentId, 'Rejected', reason);
      await refreshModalDocument();
      await logAndUpdateState('document_rejected', `Rejected document version: ${document.version} - Reason: ${reason}`);
    } catch (error) {
      alert(`Failed to reject document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePreviewDocument = (doc: ChecklistDocument) => {
    if (doc.status === 'Missing') return;
    const docIndex = allChecklistDocs.findIndex(d => d.id === doc.id && d.name === doc.name);
    if (docIndex !== -1) {
      setPreviewState({ isOpen: true, startIndex: docIndex });
    }
  };

  const handleAssignCase = async (userId: string, note: string) => {
    const updatedCase = await assignCase(caseData.caseId, userId);
    const assignedUser = allUsers.find(u => u.userId === userId);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('case_assigned', `Assigned case to ${assignedUser?.name}.${note ? ` Note: ${note}` : ''}`);
    }
    setIsAssignModalOpen(false);
  };

  const handleUpdateCase = async (updates: { status: CaseStatus, riskLevel: RiskLevel }) => {
    const updatedCase = await updateCaseStatus(caseData.caseId, updates);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('case_updated', `Updated status to ${updates.status} and risk to ${updates.riskLevel}`);
    }
    setIsUpdateModalOpen(false);
  };

  const handleUpdateEntity = async (entityData: Case['entity']) => {
    const updatedCase = await updateEntityData(caseData.caseId, entityData);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('entity_updated', `Updated entity profile.`);
    }
  };

  const handleAddCallReport = async (reportData: Omit<CallReport, 'reportId'>) => {
    const updatedCase = await addCallReport(caseData.caseId, reportData);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('call_report_added', `Added a new call report.`);
    }
  };

  const handleUpdateCallReport = async (reportId: string, reportData: Omit<CallReport, 'reportId'>) => {
    try {
      const updatedCase = await updateCallReport(caseData.caseId, reportId, reportData);
      if (updatedCase) {
        setDetails(prev => ({ ...prev, caseData: updatedCase }));
        await logAndUpdateState('call_report_updated', `Updated call report ${reportId}`);
      }
    } catch (error) {
      console.error("Failed to update call report:", error);
      alert('Failed to update call report. Please try again.');
    }
  };

  const handleDeleteCallReport = async (reportId: string, reason: string) => {
    try {
      await deleteCallReport(caseData.caseId, reportId, reason);
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        setDetails(updatedDetails);
      }
      await logAndUpdateState('call_report_deleted', `Deleted call report ${reportId}. Reason: ${reason}`);
    } catch (error) {
      console.error("Failed to delete call report:", error);
      alert('Failed to delete call report. Please try again.');
    }
  };

  const TabButton = ({ tabId, label }: { tabId: CaseDetailTab, label: string }) => (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${
          activeTab === tabId
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
        }`}
      >
        {label}
      </button>
  );

  const docHandlerProps = {
    onLinkDocument: handleLinkDocument,
    onUploadDocument: handleSaveUpload,
    onScan: handleScanUpload,
    onShowHistory: handleShowHistory,
    onPreview: handlePreviewDocument,
    onApprove: handleApproveDocument,
    onReject: handleRejectDocument
  };

  return (
    <>
      <AddPartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onAddParty={handleAddNewParty}
        masterIndividuals={allParties}
        entityType={caseData.entity.entityType}
        existingPartyIds={existingPartyIds}
      />

      <EditPartyModal
        isOpen={isEditPartyModalOpen}
        onClose={() => {
          setIsEditPartyModalOpen(false);
          setEditingParty(null);
        }}
        onUpdateParty={handleUpdateParty}
        onRemoveParty={handleRemoveParty}
        party={editingParty}
        entityType={caseData.entity.entityType}
        existingPartyIds={existingPartyIds}
      />

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

      <AssignCaseModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignCase}
        users={allUsers}
        currentAssigneeId={caseData.assignedTo}
      />
      
      <UpdateCaseModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={handleUpdateCase}
        currentStatus={caseData.status}
        currentRiskLevel={caseData.riskLevel}
      />

      <div className="space-y-8">
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/cases" className="flex items-center gap-2 text-sm mb-4 text-blue-600 dark:text-blue-400 hover:underline">
                <ChevronLeft size={16} /> Back to Cases
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{caseData.entity.entityName}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{caseData.entity.entityType} &bull; Case ID: {caseData.caseId}</p>
              {caseData.assignedTo && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assigned to: {allUsers.find(u => u.userId === caseData.assignedTo)?.name || caseData.assignedTo}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <StatusBadge status={caseData.status} />
                <RiskBadge level={caseData.riskLevel} />
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <WithPermission permission="case:update">
                  <button onClick={() => setIsAssignModalOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                    <UserPlus size={12} /> Assign
                  </button>
                </WithPermission>
                <WithPermission permission="case:update">
                  <button onClick={() => setIsUpdateModalOpen(true)} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                    <Edit size={12} /> Update Case
                  </button>
                </WithPermission>
              </div>
            </div>
          </div>
        </div>

        {isException && (
          <div className="p-4 rounded-xl border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  Exception Case
                </h4>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                  {exceptionReason || "This case requires additional corporate optional documents"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Workflow Progress</h3>
          <WorkflowProgress currentStageId={caseData.workflowStage} />
        </div>

        {!isLoadingChecklist && <CaseOverview progress={checklistData.progress} />}

        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="flex -mb-px px-6 overflow-x-auto">
                    <TabButton tabId="checklist" label="Checklist" />
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
                            <PartyList 
                                caseData={caseData} 
                                parties={parties} 
                                onAddParty={() => setIsPartyModalOpen(true)}
                                onEditParty={handleEditParty}
                                onRemoveParty={handleRemoveParty}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            {isLoadingChecklist ? (
                                <div className="text-center py-12">Loading checklist...</div>
                            ) : (
                              <DocumentChecklist
                                caseData={caseData}
                                isChecklistTab={true}           // Shows "Document Checklist" title
                                showCategoryGrouping={true}      // Shows Customer/Bank category grouping
                                parties={parties}
                                checklist={checklistData.checklist}
                                scannerProfiles={scannerProfiles}
                                {...docHandlerProps}
                              />
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'entity_profile' && (
                  <EntityProfileView 
                    entity={caseData.entity} 
                    caseId={caseData.caseId} 
                    onUpdate={handleUpdateEntity} 
                  />
                )}
                {activeTab === 'credit_details' && (
                  <CreditDetailsView
                    caseData={caseData}
                    documents={documents}
                    scannerProfiles={scannerProfiles}
                    {...docHandlerProps}
                  />
                )}
                {activeTab === 'call_reports' && (
                  <CallReportsView
                    reports={caseData.callReports}
                    onAddReport={handleAddCallReport}
                    onUpdateReport={handleUpdateCallReport}
                    onDeleteReport={handleDeleteCallReport}
                  />
                )}
                {activeTab === 'ad_hoc' && (
                  <AdHocDocumentsView 
                  parties={[]}
                    caseData={caseData} 
                    documents={documents} 
                    scannerProfiles={scannerProfiles} 
                    {...docHandlerProps} 
                  />
                )}
                {activeTab === 'activity_log' && (
                  <ActivityLogView 
                    activities={caseData.activities} 
                    users={allUsers} 
                  />
                )}
            </div>
        </div>
      </div>
    </>
  );
}