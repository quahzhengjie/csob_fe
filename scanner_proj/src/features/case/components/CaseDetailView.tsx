// =================================================================================
// FILE: src/features/case/components/CaseDetailView.tsx
// =================================================================================
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit, UserPlus } from 'lucide-react';
import type { Case, Party, Document, CaseDocumentLink, ScannerProfile, NewPartyData, DocumentVersion, CallReport } from '@/types/entities';
import type { CaseStatus, RiskLevel } from '@/types/enums';
import { assignCase, updateCaseStatus, addActivityLog, updateEntityData, addCallReport, uploadDocument, triggerScan, getCaseDetails, updateDocumentStatus, updateDocumentLink } from '@/lib/apiClient';
import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WithPermission } from '@/features/rbac/WithPermission';
import { generateLiveChecklist, type ChecklistDocument, type ChecklistSection } from '../utils/checklist';
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
import { AccountDocumentChecklist } from './AccountDocumentChecklist';

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

type CaseDetailTab = 'checklist' | 'account' | 'entity_profile' | 'credit_details' | 'call_reports' | 'ad_hoc' | 'activity_log';

export default function CaseDetailView({ details: initialDetails }: CaseDetailViewProps) {
  const [details, setDetails] = useState(initialDetails);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [historyModalDoc, setHistoryModalDoc] = useState<{doc: Document} | null>(null);
  const [activeTab, setActiveTab] = useState<CaseDetailTab>('checklist');
  const [previewState, setPreviewState] = useState<{ isOpen: boolean; startIndex: number }>({ isOpen: false, startIndex: 0 });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // State for async checklist data
  const [checklistData, setChecklistData] = useState<{
    checklist: ChecklistSection[];
    progress: { percentage: number; missingDocs: ChecklistDocument[] };
  }>({ checklist: [], progress: { percentage: 0, missingDocs: [] } });
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);

  const { caseData, parties, documents, documentLinks, scannerProfiles, allParties, allUsers } = details;

  // Load checklist data asynchronously
  useEffect(() => {
    const loadChecklist = async () => {
      setIsLoadingChecklist(true);
      try {
        const result = await generateLiveChecklist(caseData, parties, documents, documentLinks);
        setChecklistData(result);
      } catch (error) {
        console.error('Failed to generate checklist:', error);
      } finally {
        setIsLoadingChecklist(false);
      }
    };

    loadChecklist();
  }, [caseData, parties, documents, documentLinks]);

  const allChecklistDocs = useMemo(() =>
    checklistData.checklist.flatMap(section => section.documents).filter(doc => doc.status !== 'Missing'),
  [checklistData.checklist]);

  const logAndUpdateState = async (type: string, logDetails: string) => {
    const updatedCase = await addActivityLog(caseData.caseId, { type, details: logDetails, performedBy: 'USER-001' });
    if (updatedCase) {
        setDetails(prev => ({ ...prev, caseData: updatedCase }));
    }
  };

  const handleLinkDocument = async (docToLink: ChecklistDocument) => {
    if (!docToLink.reusableDocument) return;
    const newLink: CaseDocumentLink = {
        linkId: `LNK-${crypto.randomUUID()}`, 
        caseId: caseData.caseId,
        documentId: docToLink.reusableDocument.documentId, 
        versionId: docToLink.reusableDocument.versionId, 
        status: 'Verified', 
        comments: 'Linked from existing master document.'
    };
    setDetails(current => ({ ...current, documentLinks: [...current.documentLinks, newLink] }));
    await logAndUpdateState('document_linked', `Linked document: ${docToLink.name}`);
  };

  // In CaseDetailView.tsx - Replace the handleSaveUpload function with this:

const handleSaveUpload = async (doc: ChecklistDocument, uploadDetails: { expiryDate: string, comments: string, file?: File }) => {
  try {
    // Determine if this is a case document or party document
    // Case documents have ownerId equal to customerId (entity's customerId)
    const isEntityDoc = doc.ownerId === caseData.entity.customerId;
    const ownerType = isEntityDoc ? 'CASE' : 'PARTY';
    const ownerId = isEntityDoc ? caseData.caseId : doc.ownerId; // Use caseId for case documents, partyId for party documents
    
    console.log('Uploading document:', {
      documentName: doc.name,
      ownerType,
      ownerId,
      isEntityDoc,
      docOwnerId: doc.ownerId,
      caseId: caseData.caseId,
      customerId: caseData.entity.customerId,
      metadata: {
        expiryDate: uploadDetails.expiryDate,
        comments: uploadDetails.comments
      }
    });
    
    // Call the API to upload the document
    if (uploadDetails.file) {
      // ✅ Pass metadata to the upload function
      const uploadedDoc = await uploadDocument(
        ownerId, 
        ownerType, 
        doc.name, 
        uploadDetails.file,
        {
          expiryDate: uploadDetails.expiryDate,
          comments: uploadDetails.comments
        }
      );
      
      console.log('Document uploaded successfully:', uploadedDoc);
      
      // Refresh the case details to get the updated document list
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
      // Determine if this is a case document or party document
      const isEntityDoc = doc.ownerId === caseData.entity.customerId;
      const ownerType = isEntityDoc ? 'CASE' : 'PARTY';
      const ownerId = isEntityDoc ? caseData.caseId : doc.ownerId; // Use caseId for case documents, partyId for party documents
      
      console.log('🔍 RECEIVED SCAN DETAILS:', JSON.stringify(scanDetails, null, 2));
      console.log('🔍 scanDetails.scanDetails object:', scanDetails.scanDetails);
      
      // ✅ FIXED: Check for 'profile' field first, then 'profileName' as fallback
      const profileName = (scanDetails.scanDetails.profile as string) || 
                         (scanDetails.scanDetails.profileName as string) || 
                         'Default Scanner';
      
      console.log('🎯 PROFILE NAME RESOLUTION:');
      console.log('- scanDetails.scanDetails.profile =', scanDetails.scanDetails.profile);
      console.log('- scanDetails.scanDetails.profileName =', scanDetails.scanDetails.profileName);
      console.log('- Final profileName =', profileName);
      
      const scanRequest = {
        profileName: profileName,
        ownerType,
        ownerId,
        documentType: doc.name,
        format: (scanDetails.scanDetails.format as string) || 'pdf'
      };
      
      console.log('🚀 FINAL SCAN REQUEST:', JSON.stringify(scanRequest, null, 2));
      
      const scanResult = await triggerScan(scanRequest);
      
      console.log('✅ Scan completed, result:', scanResult);
      
      if (scanResult.documentId) {
        // Refresh the case details to get the new document
        const updatedDetails = await getCaseDetails(caseData.caseId);
        if (updatedDetails) {
          setDetails(updatedDetails);
        }
        await logAndUpdateState('document_scanned', `Scanned document: ${doc.name}`);
      }
      
      // Return success to the form
      return scanResult;
    } catch (error) {
      console.error('❌ Failed to scan document:', error);
      // Check if it's a backend configuration issue
      if (error instanceof Error && error.message.includes('500')) {
        alert('Scanner not available. Please ensure the scanner is connected and powered on, or use the upload option instead.');
      } else {
        alert('Failed to scan document. Please try again.');
      }
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleAddNewParty = async (partyData: NewPartyData) => {
    const isNew = !partyData.partyId;
    const newPartyId = isNew ? `PARTY-${crypto.randomUUID()}` : partyData.partyId!;
    setDetails(current => {
        let newParties = current.parties;
        if (isNew && partyData.name) {
            const nameParts = partyData.name.split(' ');
            const newPartyRecord: Party = {
                partyId: newPartyId, 
                name: partyData.name, 
                residencyStatus: partyData.residencyStatus || 'Singaporean/PR',
                firstName: nameParts[0] || '', 
                lastName: nameParts.slice(1).join(' ') || '',
                idType: 'TBC', 
                identityNo: 'TBC', 
                birthDate: 'TBC', 
                isPEP: false,
            };
            newParties = [...current.parties, newPartyRecord];
        }
        const newCaseData = { 
          ...current.caseData, 
          relatedPartyLinks: [...current.caseData.relatedPartyLinks, { partyId: newPartyId, relationships: partyData.relationships }] 
        };
        return { ...current, caseData: newCaseData, parties: newParties };
    });
    setIsPartyModalOpen(false);
    await logAndUpdateState('party_added', `Added related party: ${partyData.name || 'existing party'}`);
  };

  const handleShowHistory = (doc: ChecklistDocument) => {
    console.log('Show history clicked for doc:', doc);
    
    // For entity documents, we need to check both possible ownerIds
    const fullDoc = documents.find(d => {
      const nameMatches = d.name === doc.name;
      
      // For entity documents, the checklist shows customerId but the document has caseId as owner
      const isEntityDoc = doc.ownerId === caseData.entity.customerId;
      const ownerMatches = isEntityDoc 
        ? d.ownerId === caseData.caseId  // Entity docs are owned by case
        : d.ownerId === doc.ownerId;     // Party docs match directly
      
      return nameMatches && ownerMatches;
    });
    
    console.log('Found document for history:', fullDoc);
    console.log('Document search details:', {
      searchingFor: { name: doc.name, ownerId: doc.ownerId, isEntity: doc.ownerId === caseData.entity.customerId },
      foundDoc: fullDoc ? { 
        name: fullDoc.name, 
        ownerId: fullDoc.ownerId, 
        documentId: fullDoc.documentId,
        versions: fullDoc.versions?.map(v => ({
          id: v.id,
          version: v.version,
          status: v.status,
          isCurrentForCase: v.isCurrentForCase // Log this field
        }))
      } : null,
      availableDocs: documents.map(d => ({ 
        name: d.name, 
        ownerId: d.ownerId, 
        documentId: d.documentId,
        versionsCount: d.versions?.length 
      }))
    });
    
    if (fullDoc) { 
      // Don't pass currentVersionId anymore - let the modal use isCurrentForCase
      setHistoryModalDoc({ doc: fullDoc }); 
    } else {
      console.error('Could not find document for history modal');
      alert('Unable to load document history. Please refresh and try again.');
    }
  };

  // ✅ ENHANCED: Make Current Document with comprehensive debugging
  const handleMakeCurrentDocument = async (documentId: string, version: DocumentVersion) => {
    try {
      console.log('🔄 Making document version current:', {
        documentId,
        versionId: version.id,
        status: version.status,
        isCurrentForCase: version.isCurrentForCase
      });
  
      // Business rule check
      if (version.status !== 'Verified') {
        alert('Only Verified documents can be made current.');
        return;
      }
  
      // Check if this version is already current
      if (version.isCurrentForCase === true) {
        alert('This version is already the current version.');
        return;
      }
  
      // Update via API
      console.log('📡 Calling updateDocumentLink API with:', {
        caseId: caseData.caseId,
        documentId,
        versionId: version.id
      });
      
      await updateDocumentLink(caseData.caseId, documentId, version.id);
      console.log('✅ API call successful');
      
      // Refresh case details to get updated state
      console.log('🔄 Refreshing case details...');
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        setDetails(updatedDetails);
        console.log('✅ Case details refreshed');
      }
      
      // Close modal and log
      setHistoryModalDoc(null);
      await logAndUpdateState('document_made_current', `Updated document version to v${version.version}`);
      alert('Document version updated successfully!');
      
    } catch (error) {
      console.error('❌ Failed to make document current:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      alert(error instanceof Error ? error.message : 'Failed to update document version');
    }
  };

  const handleApproveDocument = async (documentId: string, versionId: string) => {
    try {
      console.log('🟢 APPROVE BUTTON CLICKED:');
      console.log('- documentId:', documentId);
      console.log('- versionId:', versionId);
      console.log('- versionId as number:', parseInt(versionId));
      
      const result = await updateDocumentStatus(parseInt(versionId), 'Verified');
      console.log('✅ updateDocumentStatus result:', result);
      
      // Refresh case details to get updated status
      console.log('🔄 Refreshing case details...');
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        console.log('✅ Got updated details, setting state...');
        setDetails(updatedDetails);
      } else {
        console.log('❌ No updated details returned');
      }
      
      await logAndUpdateState('document_approved', `Approved document version: ${versionId}`);
      console.log('✅ Approval process completed successfully');
    } catch (error) {
      console.error('❌ Failed to approve document:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to approve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRejectDocument = async (documentId: string, versionId: string, reason: string) => {
    try {
      console.log('🔴 REJECT BUTTON CLICKED:');
      console.log('- documentId:', documentId);
      console.log('- versionId:', versionId);
      console.log('- reason:', reason);
      console.log('- versionId as number:', parseInt(versionId));
      
      const result = await updateDocumentStatus(parseInt(versionId), 'Rejected', reason);
      console.log('✅ updateDocumentStatus result:', result);
      
      // Refresh case details
      console.log('🔄 Refreshing case details...');
      const updatedDetails = await getCaseDetails(caseData.caseId);
      if (updatedDetails) {
        console.log('✅ Got updated details, setting state...');
        setDetails(updatedDetails);
      } else {
        console.log('❌ No updated details returned');
      }
      
      await logAndUpdateState('document_rejected', `Rejected document version: ${versionId} - Reason: ${reason}`);
      console.log('✅ Rejection process completed successfully');
    } catch (error) {
      console.error('❌ Failed to reject document:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
    const user = allUsers.find(u => u.userId === userId);
    if (updatedCase) {
        setDetails(prev => ({...prev, caseData: updatedCase}));
        await logAndUpdateState('case_assigned', `Assigned case to ${user?.name}.${note ? ` Note: ${note}` : ''}`);
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
      />
      
      <DocumentHistoryModal 
        isOpen={!!historyModalDoc} 
        onClose={() => setHistoryModalDoc(null)} 
        document={historyModalDoc?.doc ?? null} 
        onMakeCurrent={handleMakeCurrentDocument}
        onApprove={handleApproveDocument}
        onReject={handleRejectDocument}
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
        
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Workflow Progress</h3>
          <WorkflowProgress currentStageId={caseData.workflowStage} />
        </div>
        
        {!isLoadingChecklist && <CaseOverview progress={checklistData.progress} />}
        
        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="flex -mb-px px-6 overflow-x-auto">
                    <TabButton tabId="checklist" label="Checklist" />
                    <TabButton tabId="account" label="Accounts"/>
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
                            {isLoadingChecklist ? (
                                <div className="text-center py-12">Loading checklist...</div>
                            ) : (
                                <DocumentChecklist
                                  checklist={checklistData.checklist}
                                  scannerProfiles={scannerProfiles} 
                                  {...docHandlerProps}
                                />
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'account' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <PartyList caseData={caseData} parties={parties} onAddParty={() => setIsPartyModalOpen(true)} />
                        </div>
                        <div className="lg:col-span-2">
                            {isLoadingChecklist ? (
                                <div className="text-center py-12">Loading checklist...</div>
                            ) : (
                                <AccountDocumentChecklist
                                  checklist={checklistData.checklist}
                                  scannerProfiles={scannerProfiles} 
                                  {...docHandlerProps}
                                />
                            )}
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