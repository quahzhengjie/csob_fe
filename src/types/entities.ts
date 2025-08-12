// =================================================================================
// FILE: src/types/entities.ts
// =================================================================================

export type CaseStatus = 'KYC Review' | 'Pending Approval' | 'Active' | 'Rejected' | 'Prospect';
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type DocStatus = 'Missing' | 'Submitted' | 'Verified' | 'Rejected' | 'Expired';
export type RoleName = 'ROLE_MANAGER' | 'ROLE_PROCESSOR' | 'ROLE_VIEWER' | 'ROLE_COMPLIANCE' | 'ROLE_ADMIN';

// =================================================================================
// CORE ENTITY MODELS - The main business objects
// =================================================================================

export interface Case {
  caseId: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  createdDate: string;
  slaDeadline: string;
  assignedTo: string | null;
  approvedBy?: string | null;
  workflowStage: string;
  approvalChain: string[];
  isException?: boolean;
  exceptionReason?: string;
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
    businessActivity?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
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
  email?: string;
  phone?: string;
  address?: string;
}

// =================================================================================
// DOCUMENT TYPES - NEW FLAT STRUCTURE WITH USER ATTRIBUTION
// =================================================================================

// User information embedded in documents
export interface UserInfo {
  userId: string;
  username: string;
  name: string;
  department: string;
}

// Document entity - now a flat structure matching backend DocumentDto
export interface Document {
  id: number;
  name: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  sizeInBytes: number;
  status: DocStatus;
  version: number;
  ownerType: 'CASE' | 'PARTY';
  ownerId: string;
  
  // User attribution - now objects instead of strings
  uploadedBy: UserInfo | null;
  uploadedDate: string;
  verifiedBy: UserInfo | null;
  verifiedDate: string | null;
  
  rejectionReason: string | null;
  expiryDate: string | null;
  comments: string | null;
  isCurrentForCase: boolean;
  isAdHoc: boolean;
}

// =================================================================================
// USER & ROLE MANAGEMENT
// =================================================================================

export interface User {
  userId: string;
  username: string;  // ADD THIS LINE
  name: string;
  email: string;
  role: string;      // Display label
  roleId: number;    
  department: string;
  isActive: boolean;
}

// Single Role interface that works for both API responses and UI needs
export interface Role {
  id: number;                           // Database ID (required for admin functions)
  name?: string;                        // Role name like "ROLE_ADMIN" (optional as it might be the key)
  label: string;                        // Display label like "Administrator"
  permissions: Record<string, boolean>; // Permission map
}

// =================================================================================
// SUPPORTING TYPES
// =================================================================================

export interface CaseDocumentLink {
  linkId: string;
  caseId: string;
  documentId: string;
  versionId: string;
  status: DocStatus;
  comments?: string;
}

export interface CreditDetails {
  lastReviewDate?: string;
  totalExposure?: number;
  creditLimit: number;
  creditScore: string;
  assessmentNotes: string;
}

export interface CallReport {
  audioDocumentId: string | undefined;
  reportId: string;
  callDate: string;
  summary: string;
  nextSteps: string;
  callType?: 'Inbound' | 'Outbound' | 'Meeting' | 'Email';
  duration?: number;
  attendees?: string[];
  outcome?: 'Positive' | 'Neutral' | 'Negative' | 'Follow-up Required';
  createdBy?: string;
  createdDate?: string;
}

export interface ActivityLog {
  activityId: string;
  type: string;
  timestamp: string;
  performedBy: string;
  details: string;
}

export interface PartyAssociation {
  caseId: string;
  entityName: string;
  entityType: string;
  roles: string[];
}

// =================================================================================
// UI & CONFIGURATION TYPES
// =================================================================================

export interface ScannerProfile {
  id?: string;
  name: string;
  resolution: string;
  colorMode: string;
  source: string;
  isDefault: boolean;
}

export interface NewPartyData {
  // For existing party
  partyId?: string;
  
  // For new party
  name?: string;
  firstName?: string;
  lastName?: string;
  idType?: string;
  identityNo?: string;
  birthDate?: string;
  residencyStatus?: string;
  
  // Common
  relationships: Array<{
    type: string;
    ownershipPercentage?: number;
  }>;
}

export interface CaseCreationData {
  entityName: string;
  entityType: string;
  riskLevel: RiskLevel;
  status: CaseStatus;
  entity?: {
    basicNumber?: string | null;
    cisNumber?: string | null;
    taxId: string;
    address1: string;
    address2?: string | null;
    addressCountry: string;
    placeOfIncorporation: string;
    businessActivity?: string | null;
    contactPerson?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
}


export interface TemplateDoc {
  name: string;
  required?: boolean;
  validityMonths?: number;
  description?: string;
  category?: 'CUSTOMER' | 'BANK_MANDATORY' | 'BANK_NON_MANDATORY';
}

// Bank Form DTO interface
export interface BankFormDto {
  id: number;
  category: string;
  name: string;
  formCode: string;
  isMandatory: boolean;
  applicableEntityTypes: string;
  displayOrder: number;
}


export interface DocumentRequirements {
  // Using Record<string, T> tells TypeScript exactly what to expect.
  entityTemplates: Record<string, TemplateDoc[]>;
  individualTemplates: Record<string, TemplateDoc[]>;
  riskBasedDocuments: Record<string, TemplateDoc[]>;
  entityRoleMapping: Record<string, string[]>;
  bankFormTemplates?: {
    corporateMandatory: TemplateDoc[];
    corporateOptional: TemplateDoc[];
    individualStakeholder: TemplateDoc[];
  };
}

// This interface was missing an export in your previous setup.
export interface TemplateManagerViewProps {
  initialTemplates: DocumentRequirements;
}

// =================================================================================
// API CONFIGURATION TYPES
// =================================================================================

/**
 * Configuration object returned by the API containing roles and enum values
 */
export interface EnumConfig {
  roles: Record<string, Role>;
  enums: {
    caseStatus: string[];
    riskLevel: string[];
    docStatus: string[];
    entityTypes: string[];
  };
  documentRequirements?: DocumentRequirements; 
}

// =================================================================================
// ADDITIONAL TYPE UTILITIES
// =================================================================================

// Type guards
export const isCaseStatus = (value: string): value is CaseStatus => {
  return ['KYC Review', 'Pending Approval', 'Active', 'Rejected', 'Prospect'].includes(value);
};

export const isRiskLevel = (value: string): value is RiskLevel => {
  return ['High', 'Medium', 'Low'].includes(value);
};

export const isDocStatus = (value: string): value is DocStatus => {
  return ['Missing', 'Submitted', 'Verified', 'Rejected', 'Expired'].includes(value);
};

export interface EnumItemConfig {
  label: string;
  color: string;
  darkColor: string;
  icon?: string;
}

export type EnumPayload = Record<string, EnumItemConfig> & {
  _DEFAULT: EnumItemConfig;
};

export interface RoleConfig {
  label: string;
  permissions: Record<string, boolean>;
}

// Authentication types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  username: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  permissions: string[];
  expiresIn: number;
  department: string;
}

// src/types/entities.ts
export interface CaseSummary extends Case {
  missingCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

