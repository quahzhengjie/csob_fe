// The Purpose of types/entities.ts

// Think of the entities.ts file as the blueprint for the core "nouns" of our application. These are the fundamental business objects that the entire system revolves around.

// Case: Represents an onboarding application.

// Party: Represents a unique person (like a director or shareholder).

// Document: Represents a master document file with all its versions.

// These are our primary data models. If we were using a database, these interfaces would directly correspond to the main tables (e.g., a Cases table, a Parties table). The purpose of this file is to ensure that anytime we work with a "Case" in our code, it always has the same, predictable structure, which gives us type safety.
// =================================================================================
// FILE: src/types/entities.ts
// =================================================================================
import type { CaseStatus, RiskLevel, DocStatus } from './enums';

// --- Core Data Models ---

export interface Case {
  caseId: string;
  // CORRECTED: Using specific union types instead of generic 'string'
  status: CaseStatus;
  riskLevel: RiskLevel;
  createdDate: string;
  slaDeadline: string;
  assignedTo: string | null;
  approvedBy?: string | null;
  workflowStage: string;
  approvalChain: string[];
  entity: {
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
    creditDetails?: CreditDetails;
  };
  relatedPartyLinks: {
    partyId: string;
    relationships: { type: string; ownershipPercentage?: number }[];
  }[];
  callReports: CallReport[];
  activities: ActivityLog[];
}

export interface Party {
  partyId: string;
  name: string;
  firstName: string;
  lastName: string;
  residencyStatus: string;
  idType: string;
  identityNo: string;
  birthDate: string;
  employmentStatus?: string;
  employerName?: string;
  isPEP: boolean;
  pepCountry?: string;
}

export interface Document {
  documentId: string;
  ownerId: string;
  name: string;
  versions: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  version: number;
  // CORRECTED: Using specific union type
  status: DocStatus;
  uploadedDate: string;
  fileRef: string;
  expiryDate?: string;
  mimeType: string;
  fileSize?: number;
  fileHash?: string;
  uploadedBy?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  comments?: string;
  scanDetails?: Record<string, string>;
}


// --- Supporting & Relational Types ---

export interface CaseDocumentLink {
  linkId: string;
  caseId: string;
  documentId: string;
  versionId: string;
  // CORRECTED: Using specific union type
  status: DocStatus;
  comments?: string;
}

export interface CreditDetails {
    creditLimit: number;
    creditScore: string;
    assessmentNotes: string;
}

export interface CallReport {
    reportId: string;
    callDate: string;
    summary: string;
    nextSteps: string;
}

export interface ActivityLog {
    activityId: string;
    type: string;
    timestamp: string;
    performedBy: string;
    details: string;
}


// --- UI & Configuration Types ---

export interface ScannerProfile {
    id: string;
    name: string;
    resolution: string;
    colorMode: string;
    source: string;
}

export interface NewPartyData {
  partyId?: string;
  name?: string;
  residencyStatus?: string;
  relationships: { type: string; ownershipPercentage?: number }[];
}

export interface CaseCreationData {
  entityName: string;
  entityType: string;
  riskLevel: RiskLevel;
  status: CaseStatus;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
}


export interface TemplateDoc {
  name: string;
  required?: boolean;
  validityMonths?: number;
  description?: string;
}

export interface DocumentRequirements {
individualTemplates: Record<string, TemplateDoc[]>;
entityTemplates: Record<string, TemplateDoc[]>;
bankFormTemplates: {
  corporateMandatory: string[];
  corporateOptional: string[];
  individualStakeholder: string[];
};
riskBasedDocuments: Record<string, TemplateDoc[]>;
entityRoleMapping: Record<string, string[]>;
}

