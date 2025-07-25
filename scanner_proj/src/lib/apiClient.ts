// =================================================================================
// FILE: src/lib/apiClient.ts
// =================================================================================
import {
  mockCases,
  mockMasterIndividuals,
  mockMasterDocuments,
  mockCaseDocumentLinks,
  mockScannerProfiles,
  mockUsers,
  documentRequirementsTemplate, // This will be our read-only source
} from '@/data/mockData';
import type { Role, EnumConfig, CaseStatus, RiskLevel } from '@/types/enums';
import type { User, Party, Case, CaseCreationData, ActivityLog, CallReport, TemplateDoc, DocumentRequirements } from '@/types/entities';


// Create a mutable, in-memory copy of the templates for updates.
const currentTemplates: DocumentRequirements = JSON.parse(JSON.stringify(documentRequirementsTemplate));

// --- Case-related Functions ---

export const getMockCases = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return mockCases;
};

export const getCaseDetails = async (caseId: string) => {
  const caseData = mockCases.find(c => c.caseId === caseId);
  if (!caseData) return null;

  const partyIds = caseData.relatedPartyLinks.map(link => link.partyId);
  const parties = mockMasterIndividuals.filter(p => partyIds.includes(p.partyId));
  const documentLinks = mockCaseDocumentLinks.filter(link => link.caseId === caseId);

  const linkedDocumentIds = documentLinks.map(link => link.documentId);
  const entityDocumentIds = mockMasterDocuments.filter(doc => doc.ownerId === caseData.entity.customerId).map(doc => doc.documentId);

  const allDocumentIds = [...new Set([...linkedDocumentIds, ...entityDocumentIds])];
  const documents = mockMasterDocuments.filter(doc => allDocumentIds.includes(doc.documentId));

  return {
    caseData,
    parties,
    documents,
    documentLinks,
    scannerProfiles: mockScannerProfiles,
    allUsers: mockUsers,
  };
};

export const createMockCase = async (newCaseData: CaseCreationData) => {
  const newCaseId = `CASE-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const newCustomerId = `CUST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const newCase: Case = {
    caseId: newCaseId,
    status: newCaseData.status,
    riskLevel: newCaseData.riskLevel,
    createdDate: new Date().toISOString(),
    slaDeadline: sevenDaysFromNow.toISOString(),
    assignedTo: 'USER-001',
    workflowStage: 'prospect',
    approvalChain: newCaseData.riskLevel === 'High' ? ['USER-002'] : [],
    entity: {
      customerId: newCustomerId,
      entityName: newCaseData.entityName,
      entityType: newCaseData.entityType,
      taxId: 'TBC',
      address1: 'TBC',
      addressCountry: 'Singapore',
      placeOfIncorporation: 'Singapore',
      usFatcaClassificationFinal: 'Active NFFE',
    },
    relatedPartyLinks: [],
    callReports: [],
    activities: [{
        activityId: `ACT-${crypto.randomUUID()}`,
        type: 'case_created',
        timestamp: new Date().toISOString(),
        performedBy: 'USER-001',
        details: `Case created for ${newCaseData.entityName}`
    }],
  };

  mockCases.unshift(newCase);
  return newCase;
};

export const assignMockCase = async (caseId: string, userId: string) => {
  const caseIndex = mockCases.findIndex(c => c.caseId === caseId);
  if (caseIndex === -1) return null;
  mockCases[caseIndex].assignedTo = userId;
  return mockCases[caseIndex];
};

export const updateMockCase = async (caseId: string, updates: { status: CaseStatus, riskLevel: RiskLevel }) => {
  const caseIndex = mockCases.findIndex(c => c.caseId === caseId);
  if (caseIndex === -1) return null;
  const originalCase = mockCases[caseIndex];
  mockCases[caseIndex] = {
      ...originalCase,
      status: updates.status,
      riskLevel: updates.riskLevel,
      workflowStage: updates.status === 'Active' ? 'completed' : originalCase.workflowStage,
  };
  return mockCases[caseIndex];
};

export const addActivityLog = async (caseId: string, activityData: Omit<ActivityLog, 'activityId' | 'timestamp'>) => {
  const caseIndex = mockCases.findIndex(c => c.caseId === caseId);
  if (caseIndex === -1) return null;
  const newActivity: ActivityLog = {
    activityId: `ACT-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    ...activityData
  };
  mockCases[caseIndex].activities.push(newActivity);
  return mockCases[caseIndex];
};

export const updateMockEntity = async (caseId: string, entityData: Case['entity']) => {
  const caseIndex = mockCases.findIndex(c => c.caseId === caseId);
  if (caseIndex === -1) return null;
  mockCases[caseIndex].entity = entityData;
  return mockCases[caseIndex];
};

export const addMockCallReport = async (caseId: string, reportData: Omit<CallReport, 'reportId'>) => {
  const caseIndex = mockCases.findIndex(c => c.caseId === caseId);
  if (caseIndex === -1) return null;
  const newReport: CallReport = {
      reportId: `CR-${crypto.randomUUID().substring(0, 8)}`,
      ...reportData
  };
  mockCases[caseIndex].callReports.push(newReport);
  return mockCases[caseIndex];
};


// --- Party-related Functions ---

export const getMockParties = async () => {
  return mockMasterIndividuals;
};

export const getMockPartyDetails = async (partyId: string) => {
  const party = mockMasterIndividuals.find(p => p.partyId === partyId);
  if (!party) return null;
  const documents = mockMasterDocuments.filter(doc => doc.ownerId === partyId);
  return { party, documents };
};

export const updateMockParty = async (updatedParty: Party) => {
  const partyIndex = mockMasterIndividuals.findIndex(p => p.partyId === updatedParty.partyId);
  if (partyIndex === -1) return null;
  mockMasterIndividuals[partyIndex] = updatedParty;
  return updatedParty;
};


// --- User-related Functions ---

export const getMockUsers = async () => {
  return mockUsers;
};

export const addNewUser = async (newUserData: Omit<User, 'userId' | 'isActive'>) => {
  const newUser: User = {
      userId: `USER-${crypto.randomUUID().substring(0,4).toUpperCase()}`,
      isActive: true,
      ...newUserData
  };
  mockUsers.unshift(newUser);
  return newUser;
};

export const updateUserStatus = async (userId: string, newStatus: boolean) => {
  const userIndex = mockUsers.findIndex(u => u.userId === userId);
  if (userIndex === -1) return null;
  mockUsers[userIndex].isActive = newStatus;
  return mockUsers[userIndex];
};


// --- Template & Enum Functions ---

export const getMockTemplates = async () => {
  return currentTemplates;
};

export const updateMockTemplate = async (entityType: string, newDocs: TemplateDoc[]) => {
    const entityTemplates = currentTemplates.entityTemplates;
    if (entityType in entityTemplates) {
        entityTemplates[entityType] = newDocs;
        return currentTemplates;
    }
    return null;
};

export const getMockEnums = async (): Promise<EnumConfig> => {
  const roles: Record<string, Role> = {
    'General Manager': {
      label: 'General Manager',
      permissions: { 'case:read': true, 'case:update': true, 'case:approve': true, 'admin:manage-users': true, 'document:upload': true },
    },
    'Deposits Manager': {
        label: 'Deposits Manager',
        permissions: { 'case:read': true, 'case:update': true },
    },
    'Viewer': {
      label: 'Read-Only User',
      permissions: { 'case:read': true, 'case:update': false, 'case:approve': false, 'admin:manage-users': false, 'document:upload': false },
    },
  };
  const enums = {
    caseStatus: ['Prospect', 'KYC Review', 'Pending Approval', 'Active', 'Rejected'],
    riskLevel: ['Low', 'Medium', 'High'],
    docStatus: ['Missing', 'Submitted', 'Verified', 'Rejected', 'Expired'],
    entityTypes: Object.keys(currentTemplates.entityTemplates),
  };
  return { roles, enums };
};