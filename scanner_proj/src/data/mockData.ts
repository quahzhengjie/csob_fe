// =================================================================================
// FILE: src/data/mockData.ts (Enriched & Updated)
// =================================================================================
import type { Case, Party, Document, CaseDocumentLink, ScannerProfile,User, DocumentRequirements } from '@/types/entities';

/* ------------------------------------------------------------------ */
/* 1. USERS                                                           */
/* ------------------------------------------------------------------ */
export const mockUsers: User[] = [
  {
    userId: 'USER-001',
    name: 'Admin User',
    email: 'admin@bank.com',
    role: 'General Manager',
    department: 'Management',
    isActive: true,
  },
  {
    userId: 'USER-002',
    name: 'Sarah Approver',
    email: 'sarah.approver@bank.com',
    role: 'Deposits Manager',
    department: 'Deposits',
    isActive: true,
  },
  {
    userId: 'USER-003',
    name: 'John Processor',
    email: 'john.processor@bank.com',
    role: 'Deposits',
    department: 'Deposits',
    isActive: true,
  },
  {
    userId: 'USER-004',
    name: 'Mike Viewer',
    email: 'mike.viewer@bank.com',
    role: 'Viewer',
    department: 'Audit',
    isActive: false,
  },
];

/* ------------------------------------------------------------------ */
/* 2. MASTER INDIVIDUALS                                              */
/* ------------------------------------------------------------------ */
export const mockMasterIndividuals: Party[] = [
  {
    partyId: 'PARTY-001', name: 'John Tan', firstName: 'John', lastName: 'Tan', residencyStatus: 'Singaporean/PR', idType: 'NRIC', identityNo: 'S1234567A', birthDate: '1980-05-15', isPEP: false,
  },
  {
    partyId: 'PARTY-002', name: 'Sarah Chen', firstName: 'Sarah', lastName: 'Chen', residencyStatus: 'Foreigner', idType: 'Passport', identityNo: 'E1234567B', birthDate: '1992-11-20', isPEP: false,
  },
  {
    partyId: 'PARTY-003', name: 'Michael Lim', firstName: 'Michael', lastName: 'Lim', residencyStatus: 'Singaporean/PR', idType: 'NRIC', identityNo: 'S8765432C', birthDate: '1975-01-30', isPEP: true, pepCountry: 'Singapore',
  },
  {
    partyId: 'PARTY-004', name: 'Emma Smith', firstName: 'Emma', lastName: 'Smith', residencyStatus: 'Foreigner', idType: 'Passport', identityNo: 'E9988776Z', birthDate: '1990-03-12', isPEP: false,
  },
  {
    partyId: 'PARTY-005', name: 'Carlos Ruiz', firstName: 'Carlos', lastName: 'Ruiz', residencyStatus: 'Foreigner', idType: 'Passport', identityNo: 'E4455667Y', birthDate: '1988-08-08', isPEP: false,
  },
];

/* ------------------------------------------------------------------ */
/* 3. MASTER DOCUMENTS & VERSIONS                                     */
/* ------------------------------------------------------------------ */
export const mockMasterDocuments: Document[] = [
  {
    documentId: 'DOC-001', ownerId: 'PARTY-001', name: 'Identity Document / NRIC / Birth Certificate', versions: [{ id: 'd1b8f6b8-376c-4b6e-9f3b-8d7e9f3d1a2b', version: 1, status: 'Verified', uploadedDate: '2024-05-10', fileRef: '/path/to/john_nric.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-002', ownerId: 'PARTY-002', name: 'Passport', versions: [{ id: 'a2c4e6f8-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Rejected', uploadedDate: '2024-06-10', rejectionReason: 'Document was expired.', fileRef: '/path/to/sarah_passport_v1.pdf', mimeType: 'application/pdf', }, { id: 'b3d5f7g9-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 2, status: 'Verified', uploadedDate: '2024-06-15', expiryDate: '2029-06-14', fileRef: '/path/to/sarah_passport_v2.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-003', ownerId: 'PARTY-002', name: 'Proof of Residential Address', versions: [{ id: 'c4e6g8h0-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Verified', uploadedDate: '2024-06-15', expiryDate: '2024-12-01', fileRef: '/path/to/sarah_address.png', mimeType: 'image/png', }],
  },
  {
    documentId: 'DOC-004', ownerId: 'PARTY-003', name: 'Identity Document / NRIC / Birth Certificate', versions: [{ id: 'e5f7i9j1-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Verified', uploadedDate: '2025-01-09', fileRef: '/path/to/michael_nric.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-101', ownerId: 'CUST-001', name: 'ARCA / Questnet Search', versions: [{ id: 'f6g8j0k2-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Verified', uploadedDate: '2025-01-16', expiryDate: '2025-12-01', fileRef: '/path/to/arca.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-102', ownerId: 'CUST-001', name: 'Account Application Form', versions: [{ id: 'g7h9k1l3-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Verified', uploadedDate: '2025-01-16', fileRef: '/path/to/form.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-103', ownerId: 'CUST-001', name: 'Certificate of Incorporation', versions: [{ id: 'h8i0l2m4-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: 'Verified', uploadedDate: '2023-01-01', fileRef: '/path/to/incorp_cert.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-005', ownerId: 'PARTY-004', name: 'Passport', versions: [{ id: 'p-emma-v1', version: 1, status: 'Verified', uploadedDate: '2025-06-01', expiryDate: '2030-05-30', fileRef: '/path/to/emma_passport.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-006', ownerId: 'PARTY-005', name: 'Passport', versions: [{ id: 'p-carlos-v1', version: 1, status: 'Verified', uploadedDate: '2025-06-02', expiryDate: '2030-06-01', fileRef: '/path/to/carlos_passport.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-201', ownerId: 'CUST-005', name: 'Certificate of Business Registration', versions: [{ id: 'cert-sp-v1', version: 1, status: 'Verified', uploadedDate: '2024-12-15', fileRef: '/path/to/sp_cert.pdf', mimeType: 'application/pdf', }],
  },
  {
    documentId: 'DOC-301', ownerId: 'CUST-006', name: 'Regulatory Approval / Bank Licence', versions: [{ id: 'bank-lic-v1', version: 1, status: 'Verified', uploadedDate: '2023-04-10', fileRef: '/path/to/bank_licence.pdf', mimeType: 'application/pdf', }],
  },
];

/* ------------------------------------------------------------------ */
/* 4. CASE–DOCUMENT LINKS                                             */
/* ------------------------------------------------------------------ */
export const mockCaseDocumentLinks: CaseDocumentLink[] = [
  { linkId: 'LNK-001', caseId: 'CASE-2025-001', documentId: 'DOC-101', versionId: 'f6g8j0k2-376c-4b6e-9f3b-8d7e9f3d1a2c', status: 'Verified', },
  { linkId: 'LNK-002', caseId: 'CASE-2025-001', documentId: 'DOC-102', versionId: 'g7h9k1l3-376c-4b6e-9f3b-8d7e9f3d1a2c', status: 'Verified', },
  { linkId: 'LNK-004', caseId: 'CASE-2025-001', documentId: 'DOC-001', versionId: 'd1b8f6b8-376c-4b6e-9f3b-8d7e9f3d1a2b', status: 'Verified', },
  { linkId: 'LNK-005', caseId: 'CASE-2025-001', documentId: 'DOC-002', versionId: 'b3d5f7g9-376c-4b6e-9f3b-8d7e9f3d1a2c', status: 'Verified', },
  { linkId: 'LNK-101', caseId: 'CASE-2025-004', documentId: 'DOC-005', versionId: 'p-emma-v1', status: 'Verified', },
  { linkId: 'LNK-102', caseId: 'CASE-2025-004', documentId: 'DOC-006', versionId: 'p-carlos-v1', status: 'Verified', },
  { linkId: 'LNK-201', caseId: 'CASE-2025-005', documentId: 'DOC-201', versionId: 'cert-sp-v1', status: 'Verified', },
  { linkId: 'LNK-301', caseId: 'CASE-2025-006', documentId: 'DOC-301', versionId: 'bank-lic-v1', status: 'Verified', },
];

/* ------------------------------------------------------------------ */
/* 5. CASES (main onboarding folders) - CORRECTED & ALIGNED DATA      */
/* ------------------------------------------------------------------ */
export const mockCases: Case[] = [
  {
    caseId: 'CASE-2025-001',
    status: 'KYC Review',
    riskLevel: 'High',
    assignedTo: 'USER-003',
    createdDate: '2025-07-15T10:00:00Z',
    slaDeadline: '2025-07-22T10:00:00Z',
    workflowStage: 'kyc_review',
    approvalChain: ['USER-002'],
    entity: { customerId: 'CUST-001', entityName: 'TechStart Innovations Pte Ltd', entityType: 'Non-Listed Company', taxId: '202012345A', address1: '123 Tech Street', address2: '#04-56', addressCountry: 'Singapore', placeOfIncorporation: 'Singapore', usFatcaClassificationFinal: 'Active NFFE', },
    relatedPartyLinks: [ { partyId: 'PARTY-001', relationships: [{ type: 'Director' }, { type: 'Authorised Signatory' }] }, { partyId: 'PARTY-002', relationships: [{ type: 'Shareholder', ownershipPercentage: 40 }] }, ],
    // --- CORRECTED DATA ---
    callReports: [
        {
            reportId: 'CR-001',
            callDate: '2025-07-15T11:00:00Z',
            summary: 'Initial introductory call with director John Tan. Discussed business activities, expected transaction volumes, and key markets.',
            nextSteps: 'Client to provide the required documentation by EOD 16/07. Follow up if not received.',
        }
    ],
    activities: [
        { activityId: 'ACT-001', timestamp: '2025-07-18T16:30:00Z', performedBy: 'John Processor', type: 'COMMENT', details: 'High risk level due to cross-border transactions with emerging markets. Enhanced due diligence will be required for Source of Wealth.' },
        { activityId: 'ACT-002', timestamp: '2025-07-18T14:05:00Z', performedBy: 'John Processor', type: 'DOC_UPLOAD', details: 'Uploaded "Passport" for Sarah Chen.' },
        { activityId: 'ACT-003', timestamp: '2025-07-17T11:20:00Z', performedBy: 'SYSTEM', type: 'STATUS_CHANGE', details: 'Status changed from "Prospect" to "KYC Review".' },
        { activityId: 'ACT-004', timestamp: '2025-07-15T10:01:00Z', performedBy: 'SYSTEM', type: 'ASSIGNMENT', details: 'Case assigned to John Processor.' },
        { activityId: 'ACT-005', timestamp: '2025-07-15T10:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created.' },
    ],
  },
  {
    caseId: 'CASE-2025-002',
    status: 'Pending Approval',
    riskLevel: 'Medium',
    assignedTo: 'USER-003',
    createdDate: '2025-07-12T14:00:00Z',
    slaDeadline: '2025-07-19T14:00:00Z',
    workflowStage: 'pending_approval',
    approvalChain: ['USER-002'],
    entity: { customerId: 'CUST-002', entityName: 'Lim Family Trust', entityType: 'Trust Account', taxId: 'T21-12345Z', address1: '456 Family Ave', addressCountry: 'Singapore', placeOfIncorporation: 'Singapore', usFatcaClassificationFinal: 'Passive NFFE', },
    relatedPartyLinks: [{ partyId: 'PARTY-003', relationships: [{ type: 'Trustee' }] }],
    // --- CORRECTED DATA ---
    callReports: [],
    activities: [
        { activityId: 'ACT-006', timestamp: '2025-07-16T09:15:00Z', performedBy: 'John Processor', type: 'COMMENT', details: 'KYC review complete. All documents are verified. PEP status for Michael Lim confirmed. Ready for manager approval.' },
        { activityId: 'ACT-007', timestamp: '2025-07-16T09:14:00Z', performedBy: 'SYSTEM', type: 'STATUS_CHANGE', details: 'Status changed from "KYC Review" to "Pending Approval".' },
        { activityId: 'ACT-008', timestamp: '2025-07-14T10:00:00Z', performedBy: 'John Processor', type: 'DOC_UPLOAD', details: 'Uploaded "Trust Deed or Indenture of Trust".' },
        { activityId: 'ACT-009', timestamp: '2025-07-12T14:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created and assigned to John Processor.' },
    ],
  },
  {
    caseId: 'CASE-2025-003',
    status: 'Active',
    riskLevel: 'Low',
    assignedTo: null,
    createdDate: '2025-06-20T09:00:00Z',
    slaDeadline: '2025-06-27T09:00:00Z',
    workflowStage: 'completed',
    approvalChain: [],
    entity: { customerId: 'CUST-003', entityName: 'Global Exports LLP', entityType: 'Partnership', taxId: 'P22-98765X', address1: '789 Trade Hub', addressCountry: 'Singapore', placeOfIncorporation: 'Singapore', usFatcaClassificationFinal: 'Active NFFE', },
    relatedPartyLinks: [],
    // --- CORRECTED DATA ---
    callReports: [],
    activities: [
        { activityId: 'ACT-010', timestamp: '2025-06-26T17:00:00Z', performedBy: 'SYSTEM', type: 'SYSTEM', details: 'Account successfully activated in core banking system.' },
        { activityId: 'ACT-011', timestamp: '2025-06-26T16:55:00Z', performedBy: 'SYSTEM', type: 'STATUS_CHANGE', details: 'Status changed from "Approved" to "Active".' },
        { activityId: 'ACT-012', timestamp: '2025-06-26T15:00:00Z', performedBy: 'Sarah Approver', type: 'APPROVAL', details: 'Case approved.' },
        { activityId: 'ACT-013', timestamp: '2025-06-25T10:00:00Z', performedBy: 'John Processor', type: 'COMMENT', details: 'All checks passed. Submitted for approval.' },
        { activityId: 'ACT-014', timestamp: '2025-06-20T09:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created.' },
    ],
  },
  {
    caseId: 'CASE-2025-004',
    status: 'Prospect',
    riskLevel: 'Low',
    assignedTo: null,
    createdDate: '2025-07-18T12:00:00Z',
    slaDeadline: '2025-07-25T12:00:00Z',
    workflowStage: 'initiation',
    approvalChain: [],
    entity: { customerId: 'CUST-004', entityName: 'Emma Smith & Carlos Ruiz (Joint Account)', entityType: 'Joint Account (Non-resident)', taxId: '', address1: '', addressCountry: '—', placeOfIncorporation: '—', usFatcaClassificationFinal: 'N/A', },
    relatedPartyLinks: [ { partyId: 'PARTY-004', relationships: [{ type: 'Joint Account Holder' }] }, { partyId: 'PARTY-005', relationships: [{ type: 'Joint Account Holder' }] }, ],
    // --- CORRECTED DATA ---
    callReports: [],
    activities: [
        { activityId: 'ACT-015', timestamp: '2025-07-18T12:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created.' },
    ],
  },
  {
    caseId: 'CASE-2025-005',
    status: 'KYC Review',
    riskLevel: 'Low',
    assignedTo: 'USER-003',
    createdDate: '2025-07-19T13:00:00Z',
    slaDeadline: '2025-07-26T13:00:00Z',
    workflowStage: 'kyc_review',
    approvalChain: ['USER-002'],
    entity: { customerId: 'CUST-005', entityName: 'BrightPrint Design (SP)', entityType: 'Sole Proprietorship', taxId: 'SP-556677', address1: '22 Creativity Lane', addressCountry: 'Singapore', placeOfIncorporation: 'Singapore', usFatcaClassificationFinal: 'Active NFFE', },
    relatedPartyLinks: [{ partyId: 'PARTY-001', relationships: [{ type: 'Sole Proprietor' }] }],
    // --- CORRECTED DATA ---
    callReports: [],
    activities: [
        { activityId: 'ACT-016', timestamp: '2025-07-21T10:45:00Z', performedBy: 'John Processor', type: 'DOC_REJECT', details: 'Rejected "ARCA / Questnet Search". Reason: Document is older than 1 month.' },
        { activityId: 'ACT-017', timestamp: '2025-07-19T13:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created.' },
    ],
  },
  {
    caseId: 'CASE-2025-006',
    status: 'KYC Review',
    riskLevel: 'Medium',
    assignedTo: 'USER-003',
    createdDate: '2025-07-21T14:00:00Z',
    slaDeadline: '2025-07-28T14:00:00Z',
    workflowStage: 'kyc_review',
    approvalChain: ['USER-002'],
    entity: { customerId: 'CUST-006', entityName: 'Banco Internacional S.A.', entityType: 'Bank', taxId: 'BR-998877', address1: '100 Avenida Central', addressCountry: 'Brazil', placeOfIncorporation: 'Brazil', usFatcaClassificationFinal: 'Participating FFI', },
    relatedPartyLinks: [{ partyId: 'PARTY-003', relationships: [{ type: 'Director' }] }],
    // --- CORRECTED DATA ---
    callReports: [
        {
            reportId: 'CR-002',
            callDate: '2025-07-21T15:00:00Z',
            summary: 'Meeting with the compliance head of Banco Internacional. Confirmed their status as a Participating FFI under FATCA. Discussed the nature of their downstream correspondent accounts.',
            nextSteps: 'No immediate follow-up required. Awaiting standard document set.',
        }
    ],
    activities: [
      { activityId: 'ACT-018', timestamp: '2025-07-21T14:00:00Z', performedBy: 'SYSTEM', type: 'CREATION', details: 'Case created.' },
    ],
  },
];

export const mockScannerProfiles: ScannerProfile[] = [
    { id: 'fujitsu-fi-7160-300-color', name: 'Office Fujitsu - 300dpi Color', resolution: '300dpi', colorMode: 'Color', source: 'ADF' },
    { id: 'hp-scanjet-pro-600-gray', name: 'HP ScanJet Pro - 600dpi Grayscale', resolution: '600dpi', colorMode: 'Grayscale', source: 'Flatbed' },
    { id: 'mobile-cam-scanner', name: 'Mobile Cam Scanner', resolution: 'N/A', colorMode: 'Color', source: 'Mobile Camera' },
];

// --- CLEANED UP & EXPANDED TEMPLATES ---
// =================================================================================
// FILE: src/config/documentRequirementsTemplate.ts
// =================================================================================
/**
 * Master ruleset for generating live onboarding check-lists.
 * ──────────────────────────────────────────────────────────
 * • `individualTemplates`      keyed by residency status
 * • `entityTemplates`          keyed by case.entity.entityType
 * • `bankFormTemplates`
 *        – corporateMandatory  → always required for every entity
 *        – corporateOptional   → add **only** if onboardingCase.isException === true
 *        – individualStakeholder → forms each person (director, partner, etc.) signs
 * • `riskBasedDocuments`       keyed by case.riskLevel
 * • `entityRoleMapping`        tells the engine which parties to collect IND docs from
 */
/* ------------------------------------------------------------------------ */
/*  COMPLETE, CLEAN, DE-DUPED RULEBOOK                                      */
/* ------------------------------------------------------------------------ */
export const documentRequirementsTemplate: DocumentRequirements = {
  /* 1. NATURAL-PERSON DOCUMENTS (key = residencyStatus) */
  individualTemplates: {
    "Singaporean/PR": [
      { name: "Identity Document / NRIC / Birth Certificate", required: true }
    ],
    Foreigner: [
      { name: "Passport", required: true, validityMonths: 6 },
      { name: "Work Permit / Employment Pass", required: true,
        description: "(Only if employed in SG)" },
      { name: "Proof of Residential Address", required: true,
        validityMonths: 3, description: "(Needed if address not on ID)" }
    ]
  },

  /* 2. ENTITY-LEVEL CUSTOMER DOCUMENTS (key = entityType) */
  entityTemplates: {
    "Non-Listed Company": [
      { name: "ARCA / Questnet Search", required: true, validityMonths: 1 },
      { name: "Certificate of Incorporation", required: true },
      { name: "Memorandum & Articles of Association", required: true }
    ],
    "Joint Account": [],                        // 2× individuals supply docs
    "Joint Account (Non-resident)": [],
    "Partnership": [
      { name: "Certificate of Partnership", required: true },
      { name: "Partnership Deed / Agreement", required: true },
      { name: "ARCA / Questnet Search", required: true, validityMonths: 1 }
    ],
    "Sole Proprietorship": [
      { name: "Certificate of Business Registration", required: true },
      { name: "ARCA / Questnet Search", required: true, validityMonths: 1 }
    ],
    "Societies/MCST": [
      { name: "Certificate of Registration / ROS Letter", required: true },
      { name: "Extract of Office Bearers", required: true, validityMonths: 1 },
      { name: "Constitution / Bye-Laws", required: true },
      { name: "Committee / Council Resolution", required: true, validityMonths: 2 }
    ],
    "Trust Account": [
      { name: "Declaration of Trusts / Registration", required: true },
      { name: "Trust Deed or Indenture of Trust", required: true,
        description: "(Sighted & CTC by bank officer)" },
      { name: "Trustee Resolution", required: true, validityMonths: 2 }
    ],
    "Listed Company": [
      { name: "Latest Annual Report (extract)", required: true }
    ],
    "Complex Corporation": [
      { name: "Detailed Ownership Structure Chart", required: true }
    ],
    "Local Regulated Company": [
      { name: "Regulator Licence / Approval Letter", required: true }
    ],
    "Foundation": [
      { name: "Foundation Charter", required: true },
      { name: "Council / Board List", required: true }
    ],
    "Non-Profit Organization": [
      { name: "Certified Constitution / Bye-Laws", required: true },
      { name: "Latest Office Bearers List", required: true }
    ],
    "Bank": [
      { name: "Regulatory Approval / Bank Licence", required: true },
      { name: "Certificate of Incorporation", required: true }
    ],
    "Foreign Govt. Organization": [
      { name: "Official Authorisation Letter", required: true },
      { name: "Constitutional Documents", required: true }
    ]
  },

  /* 3. BANK FORMS – three clean buckets */
  bankFormTemplates: {
    corporateMandatory: [
      "Signature Card",
      "Board Resolutions",
      "Account Application Form",
      "E-Statement Application Form",
      "Declaration of Beneficial Owner(s) Form",
      "FATCA & CRS Classification (Entities)",
      "FATCA & CRS Self-Certification (Non-Individuals)",
      "FATCA - IRS W-8 BEN-E or W-9",
      "PDPA & Marketing Consent Form",
      "KYC Form"
    ],

    corporateOptional: [
      "GM Approval Memo (Exception Case)",
      "Cheque Book Requisition Form",
      "Information Update Form (Corporate)",
      "Authority & Indemnity for Verbal Disclosure",
      "Letter of Agreement on Customer Apps for Banking Services"
    ],

    individualStakeholder: [
      /* Used ONLY when entityType === "Individual Account" or "Joint Account" */
      "Signature Card",
      "Account Application Form",
      "Mandate Form",
      "E-Statement Application Form",
      "FATCA & CRS Supplemental Form (Individuals)",
      "FATCA - IRS W-8BEN or W-9",
      "PDPA & Marketing Consent Form"
    ]
  },

  /* 4. RISK-BASED ADD-ONS */
  riskBasedDocuments: {
    High: [ { name: "Source of Wealth Declaration", required: true } ]
  },

  /* 5. ROLE–DOCUMENT MAP */
  entityRoleMapping: {
    "Non-Listed Company": [
      "Director", "Top Executive", "Authorised Signatory",
      "Beneficial Owner", "Power of Attorney"
    ],
    "Partnership": [
      "Partner", "Manager (LLP)", "Authorised Signatory",
      "Beneficial Owner", "Power of Attorney"
    ],
    "Sole Proprietorship": [
      "Sole Proprietor", "Authorised Signatory", "Beneficial Owner"
    ],
    "Societies/MCST": [
      "Chairman", "Secretary", "Treasurer", "Executive Authority",
      "Authorised Signatory", "Beneficial Owner"
    ],
    "Trust Account": [
      "Trustee", "Settlor", "Protector",
      "Authorised Signatory", "Beneficiary", "Ultimate Controller"
    ]
  }
};