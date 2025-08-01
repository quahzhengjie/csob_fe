import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Building2, User, FileText, Moon, Sun, RefreshCw, CheckCircle, AlertCircle, XCircle, ChevronRight, Home, Settings, ChevronLeft, Search, Filter, Plus, TrendingUp, Users, Edit, Trash2, Shield, Link as LinkIcon, Save, X, ChevronDown, Download, ShieldCheck, ThumbsUp, ThumbsDown, Printer, Clock, AlertTriangle, UserCheck, CheckSquare, Square, FileDown, Scan, Mail, UserPlus, Activity, ClipboardList, Calendar, Timer, Lock, History, ListTodo, Menu, Eye } from 'lucide-react';

// ===== 1. BLUEPRINT: THE COMPLETE MASTER DOCUMENT REQUIREMENTS TEMPLATE =====
const documentRequirementsTemplate = {
  "individualTemplates": { "Singaporean/PR": [{ "name": "NRIC / Birth Certificate", "required": true }], "Foreigner": [{ "name": "Passport", "required": true, "validityMonths": 6 }, { "name": "Work Permit / Employment Pass / FIN Card", "required": true, "note": "Required only if employed in Singapore." }, { "name": "Proof of Residential Address", "required": true, "validityMonths": 3 }], "Non-resident": [{ "name": "Passport", "required": true, "validityMonths": 6 }, { "name": "Proof of Residential Address", "required": true, "validityMonths": 3 }] },
  "entityTemplates": { "Non-Listed Company": { "customerProvidedDocuments": [{ "name": "ARCA / Questnet Search", "required": true, "validityMonths": 1 }, { "name": "Certificate of Incorporation", "required": true }, { "name": "Memorandum & Articles of Association (M&A) / Constitution", "required": true }] }, "Foreign Incorporate": { "customerProvidedDocuments": [{ "name": "Certificate of Incorporation/Registration", "required": true }] }, "Partnership": { "customerProvidedDocuments": [{ "name": "Partnership Deed or Agreement", "required": true }] }, "Sole-Proprietorship": { "customerProvidedDocuments": [{ "name": "ARCA / Questnet Search", "required": true, "validityMonths": 1 }] }, "Trust Account": { "customerProvidedDocuments": [{ "name": "Trust Deed or Indenture of Trust", "required": true }] }, "Societies/MCST": { "customerProvidedDocuments": [{ "name": "Certificate of Registration / Letter of Registry", "required": true }] } },
  "bankFormTemplates": { "corporate": ["Account Application Form", "Board Resolutions", "Declaration of Beneficial Owner(s) Form", "FATCA & CRS Classification Form for Entities"], "individualStakeholder": ["FATCA & CRS Supplemental Form for Individuals"] },
  "riskBasedDocuments": { "High": [{ "name": "Source of Wealth Declaration", "required": true }] },
  "entityRoleMapping": { "Non-Listed Company": ["Director", "Top Executive", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"], "Foreign Incorporate": ["Director", "Top Executive", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"], "Partnership": ["Partner", "Manager (LLP)", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"], "Sole-Proprietorship": ["Sole Proprietor", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"], "Trust Account": ["Trustee", "Settlor", "Protector", "Authorised Signatory", "Beneficiary", "Ultimate Controller"], "Societies/MCST": ["Chairman", "Secretary", "Treasurer", "Executive Authority", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"] }
};

const predefinedCreditDocs = ["Master Credit Agreement", "Financial Statements", "Credit Bureau Report", "Guarantor Agreement"];
const predefinedAdHocDocs = ["Death Certificate", "Power of Attorney", "Letter of Administration", "Court Order"];


// ===== INITIAL USER ROLES & PERMISSIONS CONFIGURATION =====
const initialUserRoles = {
    'General Manager': {
        label: 'General Manager',
        permissions: {
            canViewAllCases: true,
            canEditAllCases: true,
            canApprove: true,
            canManageUsers: true,
            canManageTemplates: true,
            canAssignTasks: true,
            canViewQueue: true,
            canHandleExceptions: true,
            canManageEscalations: true,
            canUploadDocs: true,
            canVerifyDocs: true,
            canRevertDocs: true,
        }
    },
    'Deposits Manager': {
        label: 'Deposits Manager',
        permissions: {
            canViewAllCases: true,
            canEditAssignedCases: true,
            canReviewAndPublish: true,
            canAssignTasks: true,
            canViewQueue: true,
            canUploadDocs: true,
            canVerifyDocs: true,
            canRevertDocs: true,
        }
    },
    'Deposits': {
        label: 'Deposits',
        permissions: {
            canViewAssignedCases: true,
            canEditAssignedCases: true,
            canUploadDocs: true,
            canVerifyDocs: true,
        }
    },
    'Customer Service Manager': {
        label: 'Customer Service Manager',
        permissions: {
            canViewAllCases: true,
            canEditAssignedCases: true,
            canReviewAndPublish: true,
            canAssignTasks: true,
            canViewQueue: true,
            canUploadDocs: true,
            canVerifyDocs: true,
        }
    },
    'Customer Service': {
        label: 'Customer Service',
        permissions: {
            canViewAssignedCases: true,
            canEditAssignedCases: true,
            canUploadDocs: true,
            canVerifyDocs: true,
        }
    },
    'Compliance Manager': {
        label: 'Compliance Manager',
        permissions: {
            canViewAllCases: true,
            canHandleExceptions: true,
            canRevertDocs: true,
        }
    },
    'Compliance': {
        label: 'Compliance',
        permissions: {
            canViewAllCases: true,
            canHandleExceptions: true,
        }
    },
    'Bills Manager': {
        label: 'Bills Manager',
        permissions: {
            canViewAllCases: true,
            canManageEscalations: true,
        }
    },
    'Bills': {
        label: 'Bills',
        permissions: {
            canViewAssignedCases: true,
            canManageEscalations: true,
        }
    },
    'Operations Manager': {
        label: 'Operations Manager',
        permissions: {
            canViewAllCases: true,
            canApprove: true,
            canViewQueue: true,
        }
    },
    'Viewer': {
        label: 'Read-Only User',
        permissions: {
            canViewAllCases: true,
        }
    }
};


// ===== NORMALIZED MOCK DATA (POST-REFACTOR) =====
// --- `users` collection ---
const mockUsers = [
  { userId: 'USER-001', name: 'Admin User', email: 'admin@bank.com', role: 'General Manager', department: 'Management', isActive: true },
  { userId: 'USER-002', name: 'Sarah Approver', email: 'sarah.approver@bank.com', role: 'Deposits Manager', department: 'Deposits', isActive: true },
  { userId: 'USER-003', name: 'John Processor', email: 'john.processor@bank.com', role: 'Deposits', department: 'Deposits', isActive: true },
  { userId: 'USER-004', name: 'Mike Viewer', email: 'mike.viewer@bank.com', role: 'Viewer', department: 'Audit', isActive: true },
  { userId: 'USER-005', name: 'Compliance Officer', email: 'compliance@bank.com', role: 'Compliance', department: 'Compliance', isActive: true },
];

// --- `parties` collection (Master list of individuals) ---
const mockMasterIndividuals = [
    { "partyId": "PARTY-001", "name": "John Tan", "firstName": "John", "lastName": "Tan", "residencyStatus": "Singaporean/PR", "identityNo": "S1234567A", "idType": "NRIC", "birthDate": "1980-05-15", "employmentStatus": "Employed", "employerName": "Tech Solutions", "isPEP": false },
    { "partyId": "PARTY-002", "name": "Sarah Chen", "firstName": "Sarah", "lastName": "Chen", "residencyStatus": "Foreigner", "identityNo": "E1234567B", "idType": "Passport", "birthDate": "1992-11-20", "employmentStatus": "Self-Employed", "employerName": "SC Consulting", "isPEP": false },
    { "partyId": "PARTY-003", "name": "Michael Lim", "firstName": "Michael", "lastName": "Lim", "residencyStatus": "Singaporean/PR", "identityNo": "S8765432C", "idType": "NRIC", "birthDate": "1975-01-30", "employmentStatus": "Employed", "employerName": "Finance Corp", "isPEP": true, "pepCountry": "Singapore" }
];

// --- `documents` collection (Central repository of all documents) ---
const mockMasterDocuments = [
    { documentId: "DOC-001", ownerId: "PARTY-001", name: "NRIC / Birth Certificate", versions: [{ id: 'd1b8f6b8-376c-4b6e-9f3b-8d7e9f3d1a2b', version: 1, status: "Verified", uploadedDate: "2024-05-10", fileRef: "/path/to/john_nric.pdf", mimeType: 'application/pdf', fileSize: 123456, fileHash: 'sha256-abc...' }] },
    { documentId: "DOC-002", ownerId: "PARTY-002", name: "Passport", versions: [
        { id: 'a2c4e6f8-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Rejected", uploadedDate: "2024-06-10", rejectionReason: "Document was expired.", fileRef: "/path/to/sarah_passport_v1.pdf", mimeType: 'application/pdf', fileSize: 234567, fileHash: 'sha256-def...' },
        { id: 'b3d5f7g9-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 2, status: "Verified", uploadedDate: "2024-06-15", verifiedDate: "2024-06-15", expiryDate: "2029-06-14", fileRef: "/path/to/sarah_passport_v2.pdf", mimeType: 'application/pdf', fileSize: 234599, fileHash: 'sha256-ghi...' }
    ]},
    { documentId: "DOC-003", ownerId: "PARTY-002", name: "Proof of Residential Address", versions: [{ id: 'c4e6g8h0-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedDate: "2024-06-15", verifiedDate: "2024-09-01", expiryDate: "2024-12-01", fileRef: "/path/to/sarah_address.png", mimeType: 'image/png', fileSize: 98765, fileHash: 'sha256-jkl...' }] },
    { documentId: "DOC-004", ownerId: "PARTY-003", name: "NRIC / Birth Certificate", versions: [{ id: 'e5f7i9j1-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedDate: "2025-01-09", fileRef: "/path/to/michael_nric.pdf", mimeType: 'application/pdf', fileSize: 135790, fileHash: 'sha256-mno...' }] },
    { documentId: "DOC-101", ownerId: "CUST-001", name: "ARCA / Questnet Search", versions: [{ id: 'f6g8j0k2-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedBy: "USER-003", uploadedDate: "2025-01-16", verifiedBy: "USER-002", verifiedDate: "2024-11-01", expiryDate: "2024-12-01", comments: "Latest search from ACRA.", mimeType: 'application/pdf', fileSize: 456789, fileHash: 'sha256-pqr...' }] },
    { documentId: "DOC-102", ownerId: "CUST-001", name: "Account Application Form", versions: [{ id: 'g7h9k1l3-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedDate: "2025-01-16", mimeType: 'application/pdf', fileSize: 567890, fileHash: 'sha256-stu...' }] },
    { documentId: "DOC-103", ownerId: "CUST-001", name: "Certificate of Incorporation", versions: [{ id: 'h8i0l2m4-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Submitted", uploadedDate: "2025-01-16", rejectionReason: null, mimeType: 'image/jpeg', fileSize: 678901, fileHash: 'sha256-vwx...' }] },
    { documentId: "DOC-104", ownerId: "CUST-001", name: "Master Credit Agreement", versions: [{ id: 'i9j1m3n5-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedDate: "2025-01-16", mimeType: 'application/pdf', fileSize: 789012, fileHash: 'sha256-yza...' }] },
    { documentId: "DOC-105", ownerId: "CUST-001", name: "Financial Statements (2024)", versions: [{ id: 'j0k2n4o6-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Submitted", uploadedDate: "2025-01-16", mimeType: 'application/pdf', fileSize: 890123, fileHash: 'sha256-bcd...' }] },
    { documentId: "DOC-106", ownerId: "CUST-001", name: "Special Power of Attorney", versions: [{ id: 'k1l3o5p7-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Submitted", uploadedBy: "USER-001", uploadedDate: "2025-02-01", mimeType: 'application/pdf', fileSize: 901234, fileHash: 'sha256-efg...' }] },
    { documentId: "DOC-201", ownerId: "CUST-002", name: "Trust Deed or Indenture of Trust", versions: [{ id: 'l2m4p6q8-376c-4b6e-9f3b-8d7e9f3d1a2c', version: 1, status: "Verified", uploadedDate: "2025-01-09", mimeType: 'application/pdf', fileSize: 1234567, fileHash: 'sha256-hij...' }] },
];

// --- `cases` collection (Simplified case data) ---
const mockCases = [
    { 
      "caseId": "CASE-2025-001", "status": "KYC Review", "riskLevel": "High", "approvedBy": null, "assignedTo": "USER-003", "createdDate": "2025-01-15", "slaDeadline": "2025-01-22", "workflowStage": "document_collection", "approvalChain": ["USER-002", "USER-001"], 
      "entity": { "customerId": "CUST-001", "entityName": "TechStart Innovations Pte Ltd", "entityType": "Non-Listed Company", "basicNumber": null, "cisNumber": null, "address1": "123 Tech Street", "address2": "#04-56", "addressCountry": "Singapore", "placeOfIncorporation": "Singapore", "taxId": "202012345A", "usFatcaClassificationFinal": "Active NFFE",
        "creditDetails": { "creditLimit": 500000, "creditScore": "A+", "assessmentNotes": "Long-standing customer with excellent payment history." }
      }, 
      "relatedPartyLinks": [
        { "partyId": "PARTY-001", "relationships": [{ "type": "Director" }, { "type": "Authorised Signatory" }] }, 
        { "partyId": "PARTY-002", "relationships": [{ "type": "Shareholder", "ownershipPercentage": 40 }] }
      ],
      "callReports": [
        { "reportId": "CR-001", "callDate": "2025-01-14", "summary": "Initial discussion about opening a corporate account.", "nextSteps": "Follow up with document checklist." }
      ],
      "activities": [{ "activityId": "ACT-001", "type": "case_created", "performedBy": "USER-001", "timestamp": "2025-01-15T10:30:00", "details": "Case created" }, { "activityId": "ACT-002", "type": "document_uploaded", "performedBy": "USER-003", "timestamp": "2025-01-16T14:20:00", "details": "Uploaded ARCA / Questnet Search" }] 
    },
    { "caseId": "CASE-2025-002", "status": "Pending Approval", "riskLevel": "Medium", "approvedBy": null, "assignedTo": "USER-003", "createdDate": "2025-01-10", "slaDeadline": "2025-01-17", "workflowStage": "pending_approval", "approvalChain": ["USER-002"], 
      "entity": { "customerId": "CUST-002", "entityName": "Lim Family Trust", "entityType": "Trust Account", "basicNumber": "B-102345", "cisNumber": null, "address1": "456 Family Ave", "addressCountry": "Singapore", "placeOfIncorporation": "Singapore", "taxId": "T21-12345Z", "usFatcaClassificationFinal": "Passive NFFE" }, 
      "relatedPartyLinks": [
        { "partyId": "PARTY-003", "relationships": [{ "type": "Trustee" }] }, 
        { "partyId": "PARTY-001", "relationships": [{ "type": "Settlor" }] }
      ], 
      "activities": [] 
    },
    { "caseId": "CASE-2025-003", "status": "Active", "riskLevel": "Low", "approvedBy": "USER-002", "assignedTo": null, "createdDate": "2025-01-05", "slaDeadline": "2025-01-12", "workflowStage": "completed", "approvalChain": [], 
      "entity": { "customerId": "CUST-003", "entityName": "Global Exports LLP", "entityType": "Partnership", "basicNumber": "B-102301", "cisNumber": "C-987123", "address1": "789 Trade Hub", "addressCountry": "Singapore", "placeOfIncorporation": "Singapore", "taxId": "P22-98765X", "usFatcaClassificationFinal": "Active NFFE" }, 
      "relatedPartyLinks": [], "activities": [] 
    }
];

// --- `caseDocumentLinks` collection (The "Contextual Glue") ---
const mockCaseDocumentLinks = [
    { linkId: "LNK-001", caseId: "CASE-2025-001", documentId: "DOC-101", versionId: 'f6g8j0k2-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified", comments: "Latest search from ACRA." },
    { linkId: "LNK-002", caseId: "CASE-2025-001", documentId: "DOC-102", versionId: 'g7h9k1l3-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
    { linkId: "LNK-003", caseId: "CASE-2025-001", documentId: "DOC-103", versionId: 'h8i0l2m4-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Submitted" },
    { linkId: "LNK-004", caseId: "CASE-2025-001", documentId: "DOC-001", versionId: 'd1b8f6b8-376c-4b6e-9f3b-8d7e9f3d1a2b', status: "Verified" },
    { linkId: "LNK-005", caseId: "CASE-2025-001", documentId: "DOC-002", versionId: 'b3d5f7g9-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
    { linkId: "LNK-006", caseId: "CASE-2025-001", documentId: "DOC-003", versionId: 'c4e6g8h0-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
    { linkId: "LNK-007", caseId: "CASE-2025-001", documentId: "DOC-104", versionId: 'i9j1m3n5-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
    { linkId: "LNK-008", caseId: "CASE-2025-001", documentId: "DOC-105", versionId: 'j0k2n4o6-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Submitted" },
    { linkId: "LNK-009", caseId: "CASE-2025-001", documentId: "DOC-106", versionId: 'k1l3o5p7-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Submitted" },
    { linkId: "LNK-010", caseId: "CASE-2025-002", documentId: "DOC-201", versionId: 'l2m4p6q8-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
    { linkId: "LNK-011", caseId: "CASE-2025-002", documentId: "DOC-004", versionId: 'e5f7i9j1-376c-4b6e-9f3b-8d7e9f3d1a2c', status: "Verified" },
];

const mockScannerProfiles = [
    { id: 'fujitsu-fi-7160-300-color', name: 'Office Fujitsu - 300dpi Color', resolution: '300dpi', colorMode: 'Color', source: 'ADF' },
    { id: 'hp-scanjet-pro-600-gray', name: 'HP ScanJet Pro - 600dpi Grayscale', resolution: '600dpi', colorMode: 'Grayscale', source: 'Flatbed' },
    { id: 'mobile-cam-scanner', name: 'Mobile Cam Scanner', resolution: 'N/A', colorMode: 'Color', source: 'Mobile Camera' },
];

// ===== WORKFLOW STAGES =====
const workflowStages = {
  'prospect': { label: 'Prospect', next: 'document_collection', color: 'gray', icon: <Search size={16}/> },
  'document_collection': { label: 'Doc Collection', next: 'kyc_review', color: 'blue', icon: <FileText size={16}/> },
  'kyc_review': { label: 'KYC Review', next: 'pending_approval', color: 'yellow', icon: <UserCheck size={16}/> },
  'pending_approval': { label: 'Approval', next: 'completed', color: 'purple', icon: <ThumbsUp size={16}/> },
  'completed': { label: 'Completed', next: null, color: 'green', icon: <CheckCircle size={16}/> },
  'rejected': { label: 'Rejected', next: null, color: 'red', icon: <XCircle size={16}/> }
};

// ===== 3. UTILITY FUNCTIONS (REFACTORED) =====

const generateLiveChecklist = (onboardingCase, allData) => {
    if (!onboardingCase) return [];
    const { template, masterDocuments, caseDocumentLinks, masterIndividuals } = allData;
    const { caseId, entity, relatedPartyLinks, riskLevel } = onboardingCase;
    let checklist = [];

    const findDocumentContext = (docName, ownerId) => {
        const masterDoc = masterDocuments.find(d => d.ownerId === ownerId && d.name === docName);
        if (!masterDoc) {
            return { status: 'Missing', versions: [], name: docName };
        }

        const link = caseDocumentLinks.find(l => l.caseId === caseId && l.documentId === masterDoc.documentId);
        
        if (link) {
            const linkedVersion = masterDoc.versions.find(v => v.id === link.versionId) || masterDoc.versions[masterDoc.versions.length - 1];
            return {
                ...linkedVersion,
                ...link, 
                name: masterDoc.name,
                versions: masterDoc.versions,
            };
        } else {
            return {
                status: 'Missing',
                name: masterDoc.name,
                versions: masterDoc.versions,
            };
        }
    };

    const entityTemplate = template.entityTemplates[entity.entityType];
    if (entityTemplate) {
        const entityCustomerDocs = entityTemplate.customerProvidedDocuments.map(t => ({ ...t, ...findDocumentContext(t.name, entity.customerId), owner: 'Entity', ownerId: entity.customerId }));
        const entityBankForms = template.bankFormTemplates.corporate.map(name => ({ name, required: true, ...findDocumentContext(name, entity.customerId), owner: 'Entity', ownerId: entity.customerId }));
        const riskDocs = template.riskBasedDocuments[riskLevel] ? template.riskBasedDocuments[riskLevel].map(t => ({...t, ...findDocumentContext(t.name, entity.customerId), owner: 'Entity', ownerId: entity.customerId })) : [];
        checklist.push({ category: 'Entity Documents & Forms', ownerId: entity.customerId, documents: [...entityCustomerDocs, ...entityBankForms, ...riskDocs] });
    }

    (relatedPartyLinks || []).forEach(partyLink => {
        const party = masterIndividuals.find(p => p.partyId === partyLink.partyId);
        if (!party) return;

        const individualTemplates = template.individualTemplates[party.residencyStatus] || [];
        const individualBankForms = template.bankFormTemplates.individualStakeholder.map(name => ({ name, required: true }));

        const idDocsWithStatus = individualTemplates.map(t => ({ ...t, ...findDocumentContext(t.name, party.partyId), owner: party.name, ownerId: party.partyId }));
        const bankFormsWithStatus = individualBankForms.map(t => ({ ...t, ...findDocumentContext(t.name, party.partyId), owner: party.name, ownerId: party.partyId }));
        
        checklist.push({ category: `Documents for ${party.name}`, ownerId: party.partyId, documents: [...idDocsWithStatus, ...bankFormsWithStatus] });
    });

    return checklist;
};


const calculateDocumentProgress = (liveChecklist) => {
    const allDocs = liveChecklist.flatMap(section => section.documents.filter(doc => doc.required));
    if (allDocs.length === 0) return { percentage: 100, missingDocs: [] };

    const completedDocs = allDocs.filter(doc => doc.status === 'Verified' || doc.status === 'Submitted');
    const missingDocs = allDocs.filter(doc => doc.status === 'Missing' || doc.status === 'Rejected');
    
    const percentage = Math.round((completedDocs.length / allDocs.length) * 100);

    return { percentage, missingDocs };
};


const hasPermission = (userRole, permission, rolesConfig) => {
  return rolesConfig[userRole]?.permissions[permission] || false;
};

const calculateSLAStatus = (deadline) => {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return { status: 'overdue', days: Math.abs(daysRemaining) };
  if (daysRemaining <= 2) return { status: 'urgent', days: daysRemaining };
  return { status: 'normal', days: daysRemaining };
};

const isDocumentExpired = (document) => {
  if (!document.expiryDate) return false;
  return new Date() > new Date(document.expiryDate);
};

const calculateOverdueDocuments = (cases, allData) => {
  let overdueCount = 0;
  
  cases.forEach(caseItem => {
    const checklist = generateLiveChecklist(caseItem, allData);
    checklist.forEach(section => {
      section.documents.forEach(doc => {
        if (isDocumentExpired(doc)) {
          overdueCount++;
        }
      });
    });
  });
  
  return overdueCount;
};

// ===== 4. UI COMPONENTS =====

const StatusBadge = ({ status, darkMode }) => {
    const config = { 'Verified': { label: 'Verified', color: 'bg-green-100 text-green-800', darkColor: 'bg-green-800/30 text-green-300', icon: <CheckCircle className="h-3 w-3" /> }, 'Submitted': { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', darkColor: 'bg-yellow-800/30 text-yellow-300', icon: <AlertCircle className="h-3 w-3" /> }, 'Missing': { label: 'Missing', color: 'bg-red-100 text-red-800', darkColor: 'bg-red-800/30 text-red-300', icon: <XCircle className="h-3 w-3" /> }, 'Rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800', darkColor: 'bg-red-800/30 text-red-300', icon: <XCircle className="h-3 w-3" /> }, 'KYC Review': { label: 'KYC Review', color: 'bg-yellow-100 text-yellow-800', darkColor: 'bg-yellow-800/30 text-yellow-300' }, 'Onboarding': { label: 'Onboarding', color: 'bg-purple-100 text-purple-800', darkColor: 'bg-purple-800/30 text-purple-300' }, 'Active': { label: 'Active', color: 'bg-green-100 text-green-800', darkColor: 'bg-green-800/30 text-green-300' }, 'Prospect': { label: 'Prospect', color: 'bg-gray-100 text-gray-800', darkColor: 'bg-slate-700 text-gray-300' }, 'Pending Approval': { label: 'Pending Approval', color: 'bg-purple-100 text-purple-800', darkColor: 'bg-purple-800/30 text-purple-300' } }[status];
    if (!config) return null;
    return <span className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${darkMode ? config.darkColor : config.color}`}>{config.icon}{config.label}</span>;
};

const RiskBadge = ({ riskLevel, darkMode }) => {
    const config = { 'High': { label: 'High Risk', color: 'bg-red-100 text-red-800', darkColor: 'bg-red-800/30 text-red-300' }, 'Medium': { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800', darkColor: 'bg-yellow-800/30 text-yellow-300' }, 'Low': { label: 'Low Risk', color: 'bg-green-100 text-green-800', darkColor: 'bg-green-800/30 text-green-300' } }[riskLevel];
    if (!config) return null;
    return <span className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${darkMode ? config.darkColor : config.color}`}><Shield size={12}/>{config.label}</span>;
};

const SLABadge = ({ deadline, darkMode }) => {
  const slaStatus = calculateSLAStatus(deadline);
  if (!slaStatus) return null;
  
  const config = {
    'overdue': { color: 'bg-red-100 text-red-800', darkColor: 'bg-red-800/30 text-red-300', icon: <AlertTriangle size={12} /> },
    'urgent': { color: 'bg-orange-100 text-orange-800', darkColor: 'bg-orange-800/30 text-orange-300', icon: <Clock size={12} /> },
    'normal': { color: 'bg-blue-100 text-blue-800', darkColor: 'bg-blue-800/30 text-blue-300', icon: <Timer size={12} /> }
  }[slaStatus.status];
  
  const label = slaStatus.status === 'overdue' ? `${slaStatus.days}d overdue` : `${slaStatus.days}d remaining`;
  
  return (
    <span className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${darkMode ? config.darkColor : config.color}`}>
      {config.icon}{label}
    </span>
  );
};

const FormField = ({ label, value, isEditing, onChange, darkMode, as: Component = 'input', type = 'text', children, ...props }) => (
    <div>
        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</label>
        {isEditing ? (
            <Component type={type} value={value || ''} onChange={onChange} className={`w-full px-3 py-1.5 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} {...props}>
                {children}
            </Component>
        ) : (
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value || '-'}</p>
        )}
    </div>
);

const AddVersionForm = ({ darkMode, onUpload, onScan, onCancel, scannerProfiles, selectedScannerProfile, onProfileChange }) => {
    const [mode, setMode] = useState('upload'); // 'upload' or 'scan'
    const [uploadDetails, setUploadDetails] = useState({ expiryDate: '', comments: '' });
    const [scanDetails, setScanDetails] = useState({ expiryDate: '', comments: '' });
    const [scanFileType, setScanFileType] = useState('pdf');
    const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, complete

    const handleUpload = () => onUpload(uploadDetails);
    
    const handleStartScan = () => {
        setScanStatus('scanning');
        setTimeout(() => {
            setScanStatus('complete');
        }, 1500);
    };

    const handleSaveScan = () => {
        onScan({ ...scanDetails, fileType: scanFileType });
        onCancel();
    };

    return (
        <div className={`p-4 rounded-b-lg space-y-4 border-t ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex border-b">
                <button onClick={() => setMode('upload')} className={`flex-1 p-2 text-sm font-medium ${mode === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                    <Upload size={14} className="inline-block mr-2" />Upload File
                </button>
                <button onClick={() => setMode('scan')} className={`flex-1 p-2 text-sm font-medium ${mode === 'scan' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                    <Scan size={14} className="inline-block mr-2" />Scan Document
                </button>
            </div>

            {mode === 'upload' && (
                <div className="space-y-3">
                    <div className={`p-4 rounded-lg text-center border-2 border-dashed ${darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                        <Upload className={`mx-auto h-8 w-8 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                        <p className="mt-1 text-sm">Click or drag file to upload</p>
                        <p className="text-xs text-gray-500">(Mock interface)</p>
                    </div>
                    <FormField label="Expiry Date (Optional)" type="date" value={uploadDetails.expiryDate} isEditing={true} onChange={e => setUploadDetails({...uploadDetails, expiryDate: e.target.value})} darkMode={darkMode} />
                    <FormField label="Comments / Notes (Optional)" as="textarea" rows="2" value={uploadDetails.comments} isEditing={true} onChange={e => setUploadDetails({...uploadDetails, comments: e.target.value})} darkMode={darkMode} />
                    <div className="flex justify-end gap-2">
                        <button onClick={onCancel} className={`px-3 py-1.5 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
                        <button onClick={handleUpload} className={`px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500`}>Save Upload</button>
                    </div>
                </div>
            )}

            {mode === 'scan' && (
                <div className="space-y-4">
                    {scanStatus !== 'complete' ? (
                        <>
                            <FormField label="Scanner Profile" as="select" value={selectedScannerProfile} isEditing={true} onChange={e => onProfileChange(e.target.value)} darkMode={darkMode}>
                                {scannerProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </FormField>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Output Format</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center"><input type="radio" name="fileType" value="pdf" checked={scanFileType === 'pdf'} onChange={() => setScanFileType('pdf')} className="mr-2" /> PDF</label>
                                    <label className="flex items-center"><input type="radio" name="fileType" value="png" checked={scanFileType === 'png'} onChange={() => setScanFileType('png')} className="mr-2" /> PNG</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={onCancel} className={`px-3 py-1.5 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
                                <button onClick={handleStartScan} disabled={scanStatus === 'scanning'} className={`px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2`}>
                                    {scanStatus === 'scanning' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                                    {scanStatus === 'scanning' ? 'Scanning...' : 'Start Scan'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 text-center bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <p className="font-semibold text-green-700 dark:text-green-300">✓ Scan Complete. Add details below.</p>
                            </div>
                            <FormField label="Expiry Date (Optional)" type="date" value={scanDetails.expiryDate} isEditing={true} onChange={e => setScanDetails({...scanDetails, expiryDate: e.target.value})} darkMode={darkMode} />
                            <FormField label="Comments / Notes (Optional)" as="textarea" rows="2" value={scanDetails.comments} isEditing={true} onChange={e => setScanDetails({...scanDetails, comments: e.target.value})} darkMode={darkMode} />
                            <div className="flex justify-end gap-2">
                                <button onClick={onCancel} className={`px-3 py-1.5 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Cancel</button>
                                <button onClick={handleSaveScan} className={`px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500`}>Save Scanned Document</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const DocumentRequirement = ({ document, darkMode, onUpload, onScan, ownerId, onSelect, isSelected, canUpload, onShowHistory, masterDocuments, onLinkDocument, caseId, allData, onPreview }) => {
    const [isAdding, setIsAdding] = useState(false);
    const isExpired = isDocumentExpired(document);
    
    const existingVerifiedDoc = useMemo(() => {
        if (document.status !== 'Missing' || !masterDocuments) return null;

        const masterDoc = masterDocuments.find(d => d.ownerId === ownerId && d.name === document.name);
        if (!masterDoc || masterDoc.versions.length === 0) return null;

        const latestVersion = masterDoc.versions[masterDoc.versions.length - 1];
        if (latestVersion.status === 'Verified') {
            return masterDoc;
        }
        return null;
    }, [document.status, document.name, masterDocuments, ownerId]);

    const handleLinkClick = () => {
        if(existingVerifiedDoc) {
            onLinkDocument({
                caseId,
                documentId: existingVerifiedDoc.documentId,
            });
        }
    };

    const handleSaveUpload = (docDetails) => {
        onUpload({
            ownerId,
            docName: document.name,
            docDetails,
        });
        setIsAdding(false);
    };

    const handleSaveScan = (scanDetails) => {
        onScan({
            ownerId,
            docName: document.name,
            scanDetails,
        });
        setIsAdding(false);
    };

    const docId = `doc-${ownerId}-${document.name.replace(/[\s/]/g, '-')}`;
    
    return (
    <div id={docId} className={`border rounded-lg transition-all duration-300 ${darkMode ? 'border-slate-700' : 'border-gray-200'} ${isExpired ? 'border-orange-500' : ''}`}>
        <div className={`p-3 flex items-center justify-between ${isAdding ? 'rounded-t-lg' : 'rounded-lg'} ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center space-x-3">
                {onSelect && <input type="checkbox" checked={isSelected} onChange={() => onSelect(document)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />}
                <FileText className={`h-5 w-5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                <div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{document.name}</span>
                    {document.rejectionReason && <p className="text-xs text-red-500 mt-1">Rejected: {document.rejectionReason}</p>}
                    {document.comments && <p className="text-xs italic text-gray-500 mt-1">"{document.comments}"</p>}
                    {isExpired && <p className="text-xs text-orange-500 mt-1">⚠️ Document expired on {new Date(document.expiryDate).toLocaleDateString()} - renewal required</p>}
                    {document.expiryDate && !isExpired && <p className="text-xs text-gray-500 mt-1">Expires: {new Date(document.expiryDate).toLocaleDateString()}</p>}
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <StatusBadge status={document.status} darkMode={darkMode} />
                {document.status !== 'Missing' && (
                    <button onClick={() => onPreview(document)} className={`p-2 rounded-md transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600' : 'text-gray-500 hover:bg-gray-200'}`} title="Preview document">
                        <Eye className="h-4 w-4" />
                    </button>
                )}
                {document.versions && document.versions.length > 1 && (
                    <button onClick={() => onShowHistory(document)} className={`p-2 rounded-md transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600' : 'text-gray-500 hover:bg-gray-200'}`} title="View history">
                        <History className="h-4 w-4" />
                    </button>
                )}
                
                {canUpload && (document.status === 'Missing' || document.status === 'Rejected' || isExpired) && !isAdding && (
                    existingVerifiedDoc ? (
                        <div className={`p-2 rounded-lg text-xs text-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                            <p className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Verified version on file.</p>
                            <button onClick={handleLinkClick} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto">
                                <LinkIcon size={12} /> Link to this case
                            </button>
                        </div>
                    ) : (
                         <button onClick={() => setIsAdding(true)} className={`p-2 rounded-md transition-colors ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`} title="Add new version">
                            <Plus className="h-4 w-4" />
                        </button>
                    )
                )}
            </div>
        </div>
        {isAdding && (
            <AddVersionForm 
                darkMode={darkMode}
                onUpload={handleSaveUpload}
                onScan={handleSaveScan}
                onCancel={() => setIsAdding(false)}
                scannerProfiles={mockScannerProfiles}
                selectedScannerProfile={allData.selectedScannerProfile}
                onProfileChange={allData.setSelectedScannerProfile}
            />
        )}
    </div>
    );
};

const MetricCard = ({ icon: Icon, title, value, trend, darkMode }) => (<div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}><div className="flex items-center justify-between mb-4"><div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}><Icon className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} /></div>{trend && <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend}</span>}</div><div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div><p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{title}</p></div>);

const ActivityLog = ({ activities, users, darkMode }) => {
  const getActivityIcon = (type) => {
    const icons = {
      'case_created': <Plus size={16} />,
      'document_uploaded': <Upload size={16} />,
      'document_scanned': <Scan size={16} />,
      'document_verified': <CheckCircle size={16} />,
      'document_linked': <LinkIcon size={16} />,
      'document_reverted': <RefreshCw size={16} />,
      'case_approved': <UserCheck size={16} />,
      'case_rejected': <XCircle size={16} />,
      'task_assigned': <UserPlus size={16} />
    };
    return icons[type] || <Activity size={16} />;
  };

  return (
    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Activity Log</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">No activities recorded</p>
        ) : (
          [...activities].reverse().map(activity => {
            const user = users.find(u => u.userId === activity.performedBy);
            return (
              <div key={activity.activityId} className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className={`p-2 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {user?.name || 'Unknown'} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const WorkflowProgress = ({ currentStage, darkMode }) => {
    const stages = ['prospect', 'document_collection', 'kyc_review', 'pending_approval', 'completed'];
    const currentIndex = stages.indexOf(currentStage);

    return (
        <div className="w-full">
            <div className="flex items-center">
                {stages.map((stage, index) => {
                    const stageConfig = workflowStages[stage];
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <React.Fragment key={stage}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                                    ${isCurrent ? 'bg-blue-600 border-blue-600 text-white' : ''}
                                    ${!isCompleted && !isCurrent ? (darkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-gray-100 border-gray-300 text-gray-400') : ''}
                                `}>
                                    {isCompleted ? <CheckCircle size={20} /> : stageConfig.icon}
                                </div>
                                <p className={`text-xs mt-2 font-medium ${isCurrent ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-400' : 'text-gray-500')}`}>
                                    {stageConfig.label}
                                </p>
                            </div>
                            {index < stages.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : (darkMode ? 'bg-slate-700' : 'bg-gray-200')}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const CaseOverview = ({ liveChecklist, darkMode, onScrollToDocument }) => {
    const { percentage, missingDocs } = calculateDocumentProgress(liveChecklist);

    return (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Progress Section */}
                <div className="md:col-span-1 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                                className={darkMode ? "text-slate-700" : "text-gray-200"}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="currentColor" strokeWidth="3" />
                            <path
                                className={percentage > 90 ? "text-green-500" : "text-blue-500"}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${percentage}, 100`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{percentage}%</span>
                        </div>
                    </div>
                    <p className={`mt-2 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Documents Collected</p>
                </div>

                {/* Missing Docs Section */}
                <div className="md:col-span-2">
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Missing Documents ({missingDocs.length})</h4>
                    {missingDocs.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {missingDocs.map((doc, index) => (
                                <button 
                                    key={index}
                                    onClick={() => onScrollToDocument(doc)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-red-50 hover:bg-red-100'}`}>
                                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <div>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-red-800'}`}>{doc.name}</p>
                                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-red-600'}`}>Owner: {doc.owner}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={`flex flex-col items-center justify-center h-full p-4 rounded-md ${darkMode ? 'bg-slate-700/50' : 'bg-green-50'}`}>
                            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                            <p className="text-sm font-semibold text-green-600">All required documents are collected!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CallReportModal = ({ isOpen, onClose, darkMode, onSave }) => {
    const [reportData, setReportData] = useState({
        callDate: new Date().toISOString().split('T')[0],
        callType: 'Initial',
        summary: '',
        nextSteps: '',
    });

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setReportData(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        onSave(reportData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className={`p-8 rounded-xl border w-full max-w-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>New Call Report</h3>
                    <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField label="Call Date" type="date" value={reportData.callDate} isEditing={true} onChange={e => handleChange('callDate', e.target.value)} darkMode={darkMode} />
                        <FormField label="Call Type" as="select" value={reportData.callType} isEditing={true} onChange={e => handleChange('callType', e.target.value)} darkMode={darkMode}>
                            <option>Initial</option>
                            <option>Follow-up</option>
                            <option>Review</option>
                        </FormField>
                    </div>
                     <FormField label="Discussion Summary" as="textarea" rows="4" value={reportData.summary} isEditing={true} onChange={e => handleChange('summary', e.target.value)} darkMode={darkMode} />
                    <FormField label="Next Steps / Follow-up Actions" as="textarea" rows="3" value={reportData.nextSteps} isEditing={true} onChange={e => handleChange('nextSteps', e.target.value)} darkMode={darkMode} />
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button>
                    <button type="button" onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500`}>Save Report</button>
                </div>
            </div>
        </div>
    );
};

const CallReportsView = ({ caseData, darkMode, onAddCallReport }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveReport = (reportData) => {
        const newReport = {
            reportId: crypto.randomUUID(),
            ...reportData
        };
        onAddCallReport(newReport);
    };

    return (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CallReportModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveReport}
                darkMode={darkMode}
            />
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Call Reports</h3>
                <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}>
                    <Plus size={16}/> Add Report
                </button>
            </div>
            <div className="space-y-4">
                {(caseData.callReports || []).length > 0 ? (
                    (caseData.callReports || []).map(report => (
                        <div key={report.reportId} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                            <p className="font-semibold">{new Date(report.callDate).toLocaleDateString()}</p>
                            <p className="text-sm mt-2">{report.summary}</p>
                            <p className="text-xs text-gray-500 mt-2">Next Steps: {report.nextSteps}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No call reports have been logged for this case.</p>
                )}
            </div>
        </div>
    );
};


const EnhancedTemplateManagerView = ({ templates, setTemplates, darkMode }) => {
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [expandedSections, setExpandedSections] = useState({ individualTemplates: true, entityTemplates: true, bankFormTemplates: true, riskBasedDocuments: true });
    
    const EditTemplateModal = ({ isOpen, onClose, templateData, onSave, darkMode }) => {
        if (!isOpen) return null;
        const [docs, setDocs] = useState(templateData?.customerProvidedDocuments || []);
        const [newDoc, setNewDoc] = useState({ name: '', validity: '', required: true, note: '' });

        const handleAddDoc = () => {
            if (newDoc.name.trim()) {
                const docToAdd = { ...newDoc, validityMonths: newDoc.validity ? parseInt(newDoc.validity) : null };
                delete docToAdd.validity;
                setDocs([...docs, docToAdd]);
                setNewDoc({ name: '', validity: '', required: true, note: '' });
            }
        };
        const handleRemoveDoc = (index) => setDocs(docs.filter((_, i) => i !== index));
        const handleSave = () => { onSave(templateData.type, docs); onClose(); };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                <div className={`p-6 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700"><h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Template: {templateData?.type}</h3><button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X className="h-5 w-5" /></button></div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">{docs.map((doc, index) => (<div key={index} className={`p-3 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}><div><span className="font-medium">{doc.name}</span><span className="text-xs ml-2 text-gray-400">{doc.validityMonths ? `(${doc.validityMonths}m validity)`: ''}</span></div><button onClick={() => handleRemoveDoc(index)} className="p-1.5 text-red-500 rounded-md hover:bg-red-500/10"><Trash2 size={16}/></button></div>))}</div>
                    <div className="mt-4 pt-4 border-t border-slate-700"><div className="flex gap-2"><input type="text" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="New document name" className={`flex-1 px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`} /><input type="number" value={newDoc.validity} onChange={(e) => setNewDoc({ ...newDoc, validity: e.target.value })} placeholder="Validity (m)" className={`w-28 px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`} /><button onClick={handleAddDoc} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Add</button></div></div>
                    <div className="flex justify-end gap-2 mt-6"><button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>Cancel</button><button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500">Save Changes</button></div>
                </div>
            </div>
        );
    };

    const handleUpdateTemplate = (entityType, newDocs) => { setTemplates(currentTemplates => ({ ...currentTemplates, entityTemplates: { ...currentTemplates.entityTemplates, [entityType]: { ...currentTemplates.entityTemplates[entityType], customerProvidedDocuments: newDocs } } })); };
    const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

    return (<>
        <EditTemplateModal isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} templateData={editingTemplate} onSave={handleUpdateTemplate} darkMode={darkMode} />
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Document Template Manager</h2>
            {Object.entries(templates).map(([key, value]) => (
                <div key={key} className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between"><h3 className={`text-lg font-semibold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{key.replace(/([A-Z])/g, ' $1')}</h3><ChevronDown className={`h-5 w-5 transition-transform ${expandedSections[key] ? '' : '-rotate-90'}`} /></button>
                    {expandedSections[key] && <div className="mt-4 space-y-4">{key === 'entityTemplates' ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Object.entries(value).map(([type, data]) => (<div key={type} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}><div className="flex justify-between items-center mb-2"><p className="font-medium">{type}</p><button onClick={() => setEditingTemplate({ type, ...data })} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-600 rounded-md"><Edit size={16}/></button></div><ul className="space-y-1 text-sm">{data.customerProvidedDocuments.map((doc, i) => <li key={i}>• {doc.name}</li>)}</ul></div>))}</div>) : Object.entries(value).map(([subKey, docs]) => (<div key={subKey} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}><p className="font-medium mb-2">{subKey}</p><ul className="list-disc list-inside text-sm space-y-1">{docs.map((doc, i) => <li key={i}>{typeof doc === 'string' ? doc : doc.name}</li>)}</ul></div>))}</div>}
                </div>
            ))}
        </div>
    </>);
};

const NewCaseModal = ({ isOpen, onClose, onCreateCase, darkMode }) => {
    const [entityName, setEntityName] = useState(''); const [entityType, setEntityType] = useState('Non-Listed Company'); const [status, setStatus] = useState('Prospect'); const [riskLevel, setRiskLevel] = useState('Low');
    if (!isOpen) return null;
    const handleSubmit = (e) => { e.preventDefault(); if (!entityName) { return; } onCreateCase({ entityName, entityType, status, riskLevel }); onClose(); setEntityName(''); };
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"><div className={`p-8 rounded-xl border w-full max-w-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}><h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New Onboarding Case</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Entity Name</label><input type="text" value={entityName} onChange={e => setEntityName(e.target.value)} required className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div><label className="block text-sm font-medium mb-1">Entity Type</label><select value={entityType} onChange={e => setEntityType(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{Object.keys(documentRequirementsTemplate.entityTemplates).map(type => <option key={type} value={type}>{type}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Initial Stage</label><select value={status} onChange={e => setStatus(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{['Prospect', 'KYC Review', 'Onboarding'].map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Risk Level</label><select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{['Low', 'Medium', 'High'].map(r => <option key={r} value={r}>{r}</option>)}</select></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button><button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>Create Case</button></div></form></div></div>);
};

const UpdateCaseModal = ({ isOpen, onClose, onUpdateCase, caseData, darkMode }) => {
    const [status, setStatus] = useState(caseData.status); const [riskLevel, setRiskLevel] = useState(caseData.riskLevel); const [basicNumber, setBasicNumber] = useState(caseData.entity.basicNumber || ''); const [cisNumber, setCisNumber] = useState(caseData.entity.cisNumber || ''); const [approvedBy, setApprovedBy] = useState(caseData.approvedBy || '');
    if (!isOpen) return null;
    const handleSubmit = (e) => { e.preventDefault(); onUpdateCase({ status, riskLevel, basicNumber, cisNumber, approvedBy }); onClose(); };
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"><div className={`p-8 rounded-xl border w-full max-w-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}><h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Case Details</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Case Status</label><select value={status} onChange={e => setStatus(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{['Prospect', 'KYC Review', 'Onboarding', 'Pending Approval', 'Active', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Risk Level</label><select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{['Low', 'Medium', 'High'].map(r => <option key={r} value={r}>{r}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Basic Number</label><input type="text" value={basicNumber} onChange={e => setBasicNumber(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div><label className="block text-sm font-medium mb-1">CIS Number</label><input type="text" value={cisNumber} onChange={e => setCisNumber(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div><label className="block text-sm font-medium mb-1">Approved By</label><input type="text" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button><button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>Update Case</button></div></form></div></div>);
};

const AddPartyModal = ({ isOpen, onClose, onAddParty, darkMode, masterIndividuals, entityType }) => {
    const [activeTab, setActiveTab] = useState('create');
    const [name, setName] = useState(''); const [residencyStatus, setResidencyStatus] = useState('Singaporean/PR'); const [roles, setRoles] = useState([]); const [currentRole, setCurrentRole] = useState(''); const [ownership, setOwnership] = useState(''); const [searchTerm, setSearchTerm] = useState(''); const [selectedParty, setSelectedParty] = useState(null);
    const roleOptions = useMemo(() => documentRequirementsTemplate.entityRoleMapping[entityType] || [], [entityType]);
    useEffect(() => { if(roleOptions.length > 0) { setCurrentRole(roleOptions[0]); } }, [roleOptions]);
    const searchResults = useMemo(() => { if (!searchTerm) return []; return masterIndividuals.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [searchTerm, masterIndividuals]);
    if (!isOpen) return null;
    const resetForm = () => { setName(''); setRoles([]); setOwnership(''); setSelectedParty(null); setSearchTerm(''); };
    const handleClose = () => { resetForm(); onClose(); };
    const handleAddRole = () => { if (currentRole && !roles.find(r => r.type === currentRole)) { setRoles([...roles, { type: currentRole }]); } };
    const handleRemoveRole = (roleType) => { setRoles(roles.filter(r => r.type !== roleType)); };
    const handleSubmit = (e) => { e.preventDefault(); if (roles.length === 0) { return; } const finalRoles = roles.map(r => ['Shareholder', 'Partner', 'Beneficial Owner'].includes(r.type) && ownership ? { ...r, ownershipPercentage: parseInt(ownership, 10) } : r); let partyData; if (activeTab === 'create' && name) { partyData = { name, residencyStatus, relationships: finalRoles }; } else if (activeTab === 'search' && selectedParty) { partyData = { ...selectedParty, relationships: finalRoles }; } else { return; } onAddParty(partyData); handleClose(); };
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"><div className={`p-8 rounded-xl border w-full max-w-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}><h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add Related Party</h3><div className="border-b mb-4"><div className="flex -mb-px"><button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='create' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Create New</button><button onClick={() => setActiveTab('search')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='search' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Search Existing</button></div></div><form onSubmit={handleSubmit} className="space-y-4">{activeTab === 'create' ? (<><div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div><label className="block text-sm font-medium mb-1">Residency Status</label><select value={residencyStatus} onChange={e => setResidencyStatus(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{Object.keys(documentRequirementsTemplate.individualTemplates).map(status => <option key={status} value={status}>{status}</option>)}</select></div></>) : (<><div><label className="block text-sm font-medium mb-1">Search by Name</label><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Start typing to search..." className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div><div className="max-h-40 overflow-y-auto border rounded-lg">{searchResults.map(p => <div key={p.partyId} onClick={() => setSelectedParty(p)} className={`p-2 cursor-pointer ${selectedParty?.partyId === p.partyId ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>{p.name}</div>)}</div>{selectedParty && <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-md text-sm">Selected: <span className="font-semibold">{selectedParty.name}</span></div>}</>)}<div><label className="block text-sm font-medium mb-1">Roles for this Case</label><div className="flex gap-2"><select value={currentRole} onChange={e => setCurrentRole(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>{roleOptions.map(r => <option key={r} value={r}>{r}</option>)}</select><button type="button" onClick={handleAddRole} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Add</button></div><div className="mt-2 flex flex-wrap gap-2">{roles.map(role => <span key={role.type} className={`inline-flex items-center gap-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>{role.type} <button type="button" onClick={() => handleRemoveRole(role.type)} className="ml-1 text-red-500">&times;</button></span>)}</div></div>{roles.some(r => ['Shareholder', 'Partner', 'Beneficial Owner'].includes(r.type)) && <div><label className="block text-sm font-medium mb-1">Ownership Percentage (%)</label><input type="number" value={ownership} onChange={e => setOwnership(e.target.value)} placeholder="e.g., 40" className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} /></div>}<div className="flex justify-end gap-4 pt-4"><button type="button" onClick={handleClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button><button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>Add Party</button></div></form></div></div>);
};

const TaskAssignmentModal = ({ isOpen, onClose, onAssign, users, currentAssignee, darkMode, userRoles }) => {
  const [selectedUser, setSelectedUser] = useState(currentAssignee || '');
  const [note, setNote] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      return;
    }
    onAssign(selectedUser, note);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-xl border w-full max-w-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assign Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign To</label>
            <select 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)} 
              className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
            >
              <option value="">Select User</option>
              {users.filter(u => hasPermission(u.role, 'canEditAssignedCases', userRoles)).map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.name} ({userRoles[user.role]?.label})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Cancel
            </button>
            <button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500`}>
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApprovalModal = ({ isOpen, onClose, onApprove, onReject, caseData, darkMode }) => {
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!action) {
      return;
    }
    if (action === 'approve') {
      onApprove(comments);
    } else {
      onReject(comments);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-xl border w-full max-w-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Case: {caseData.entity.entityName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="action" value="approve" onChange={e => setAction(e.target.value)} className="mr-2" />
                <span className="flex items-center gap-2"><ThumbsUp size={16} className="text-green-600" />Approve</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="action" value="reject" onChange={e => setAction(e.target.value)} className="mr-2" />
                <span className="flex items-center gap-2"><ThumbsDown size={16} className="text-red-600" />Reject</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <textarea 
              value={comments} 
              onChange={e => setComments(e.target.value)} 
              rows={4}
              required
              className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Cancel
            </button>
            <button type="submit" className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${action === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScannerProfilePanel = ({ darkMode, profiles, selectedProfile, onProfileChange }) => {
  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <h4 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Scan size={20} />Scanner Profile
        </h4>
      </div>
      <p className="text-sm text-gray-500 mt-2 mb-3">
        Select the active scanner profile to use for new scans.
      </p>
      <select 
        value={selectedProfile}
        onChange={(e) => onProfileChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
      >
        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
};

const DocumentHistoryModal = ({ isOpen, onClose, document, darkMode, canRevert, onRevert }) => {
    if (!isOpen) return null;

    const reversedVersions = [...(document.versions || [])].reverse();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className={`p-6 rounded-xl border w-full max-w-2xl max-h-[90vh] flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>History for: {document.name}</h3>
                    <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {reversedVersions.map((version, index) => (
                        <div key={version.id} className={`p-4 rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                                <div className="font-semibold">Version {version.version} {index === 0 && <span className="text-xs font-normal text-green-500 ml-2">(Current)</span>}</div>
                                <StatusBadge status={version.status} darkMode={darkMode} />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                                {version.uploadedDate && <span>Uploaded on {new Date(version.uploadedDate).toLocaleDateString()}</span>}
                                {version.uploadedBy && <span> by {version.uploadedBy}</span>}
                            </div>
                            {version.rejectionReason && <p className="text-sm text-red-500 mt-1">Reason: {version.rejectionReason}</p>}
                            <div className="flex gap-2 mt-3">
                                <button className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">Download</button>
                                {canRevert && document.versionId !== version.id && (
                                    <button onClick={() => onRevert(document.documentId, version)} className="text-xs px-2 py-1 rounded bg-orange-500 text-white hover:bg-orange-600">Make Current</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>Close</button>
                </div>
            </div>
        </div>
    );
};

const AdditionalDocumentsView = ({ title, documents, docType, darkMode, onSaveDocument, onShowHistory, currentUser, userRoles, ownerId }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const docOptions = useMemo(() => docType === 'credit' ? predefinedCreditDocs : predefinedAdHocDocs, [docType]);

    useEffect(() => {
        if (isAdding && !isCustom) {
            setNewDocName(docOptions[0]);
        }
    }, [isAdding, isCustom, docOptions]);
    
    const handleAdd = (docDetails) => {
        if (!newDocName) return;
        onSaveDocument({
            ownerId,
            docName: newDocName,
            docDetails,
            docType,
        });
        setIsAdding(false);
        setNewDocName('');
        setIsCustom(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setNewDocName('');
        setIsCustom(false);
    };

    const canUpload = hasPermission(currentUser.role, 'canUploadDocs', userRoles);

    return (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                {canUpload && !isAdding && (
                    <button onClick={() => setIsAdding(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}>
                        <Upload size={16}/> Upload Document
                    </button>
                )}
            </div>

            {isAdding && (
                <div className={`p-4 rounded-lg border space-y-3 mb-4 ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="font-medium">Add New Document</h4>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Document Type</label>
                        <select 
                            value={isCustom ? 'custom' : newDocName}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setIsCustom(true);
                                    setNewDocName('');
                                } else {
                                    setIsCustom(false);
                                    setNewDocName(e.target.value);
                                }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
                        >
                            {docOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            <option value="custom">Other (Specify)</option>
                        </select>
                        {isCustom && (
                            <input 
                                type="text"
                                placeholder="Specify document name"
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                className={`mt-2 w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}
                            />
                        )}
                    </div>
                    <AddVersionForm 
                        darkMode={darkMode}
                        onUpload={handleAdd}
                        onCancel={handleCancel}
                    />
                </div>
            )}

            <div className="space-y-2">
                {(documents || []).map((doc, index) => (
                    <DocumentRequirement 
                        key={index} 
                        document={doc} 
                        darkMode={darkMode} 
                        ownerId={ownerId} 
                        canUpload={canUpload} 
                        onUpload={onSaveDocument}
                        onShowHistory={onShowHistory}
                    />
                ))}
                {(!documents || documents.length === 0) && !isAdding && (
                    <p className="text-sm text-center py-4 text-gray-500">No documents uploaded for this category.</p>
                )}
            </div>
        </div>
    );
};


const CreditDetailsView = ({ caseData, darkMode, onUpdateCreditDetails, onSaveDocument, onShowHistory, currentUser, userRoles }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [creditData, setCreditData] = useState(caseData.entity.creditDetails || { creditLimit: '', creditScore: '', assessmentNotes: '' });

    const handleChange = (field, value) => {
        setCreditData(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        onUpdateCreditDetails(creditData);
        setIsEditing(false);
    };

    const canEdit = hasPermission(currentUser.role, 'canEditAllCases', userRoles);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Credit Information</h3>
                        {canEdit && (
                            isEditing 
                                ? <button onClick={handleSave} className="text-sm flex items-center gap-1 text-blue-500 hover:underline"><Save size={12}/>Save</button>
                                : <button onClick={() => setIsEditing(true)} className="text-sm flex items-center gap-1 text-blue-500 hover:underline"><Edit size={12}/>Edit</button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <FormField label="Credit Limit" type="number" value={creditData.creditLimit} isEditing={isEditing} onChange={e => handleChange('creditLimit', e.target.value)} darkMode={darkMode} />
                        <FormField label="Credit Score / Rating" value={creditData.creditScore} isEditing={isEditing} onChange={e => handleChange('creditScore', e.target.value)} darkMode={darkMode} />
                        <FormField label="Assessment Notes" as="textarea" rows="4" value={creditData.assessmentNotes} isEditing={isEditing} onChange={e => handleChange('assessmentNotes', e.target.value)} darkMode={darkMode} />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2">
                <AdditionalDocumentsView
                    title="Credit Documents"
                    docType="credit"
                    documents={caseData.entity.creditDocuments}
                    ownerId={caseData.entity.customerId}
                    onSaveDocument={onSaveDocument}
                    onShowHistory={onShowHistory}
                    darkMode={darkMode}
                    currentUser={currentUser}
                    userRoles={userRoles}
                />
            </div>
        </div>
    );
};


const CaseDetailView = ({ onboardingCase, allData, darkMode, onBack, onAddParty, onUpdateCase, onSelectParty, onUpdateEntity, users, currentUser, onAssignTask, onAddActivity, userRoles, onRevertDocument, onUpdateCreditDetails, onSaveDocument, onAddCallReport, onLinkDocument, onScanDocument }) => {
    const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
    const [isUpdateCaseModalOpen, setIsUpdateCaseModalOpen] = useState(false);
    const [isTaskAssignModalOpen, setIsTaskAssignModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('checklist');
    const [isEditingEntity, setIsEditingEntity] = useState(false);
    const [entityEditData, setEntityEditData] = useState(onboardingCase.entity);
    const [expandedChecklist, setExpandedChecklist] = useState({});
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [historyModalData, setHistoryModalData] = useState(null);
    const [previewModalData, setPreviewModalData] = useState(null);

    const liveChecklist = useMemo(() => generateLiveChecklist(onboardingCase, allData), [onboardingCase, allData.caseDocumentLinks, allData.masterDocuments]);
    const isPartyKycComplete = (partyId) => { const partySection = liveChecklist.find(section => section.ownerId === partyId); if (!partySection) return true; return partySection.documents.every(doc => !doc.required || doc.status === 'Verified'); };
    
    useEffect(() => {
        const initialExpansionState = liveChecklist.reduce((acc, section) => { acc[section.ownerId] = true; return acc; }, {});
        setExpandedChecklist(initialExpansionState);
    }, [onboardingCase.caseId]);

    const toggleChecklistSection = (ownerId) => {
        setExpandedChecklist(prev => ({ ...prev, [ownerId]: !prev[ownerId] }));
    };

    const handleEntityChange = (field, value) => setEntityEditData(prev => ({...prev, [field]: value}));
    const handleEntitySave = () => { onUpdateEntity(entityEditData); setIsEditingEntity(false); };
    
    const handleTaskAssign = (userId, note) => {
        onAssignTask(onboardingCase.caseId, userId);
        onAddActivity(onboardingCase.caseId, {
            type: 'task_assigned',
            details: `Case assigned to ${users.find(u => u.userId === userId)?.name}${note ? `: ${note}` : ''}`
        });
    };
    
    const handleDocumentSelect = (document) => {
        setSelectedDocuments(prev => {
            const isSelected = prev.some(d => d.name === document.name);
            if (isSelected) {
                return prev.filter(d => d.name !== document.name);
            } else {
                return [...prev, document];
            }
        });
    };
    
    const handleDownloadSelected = () => {
        if (selectedDocuments.length === 0) {
            return;
        }
        // In real implementation, this would trigger actual download
        setSelectedDocuments([]);
    };
    
    const handleDownloadAll = () => {
        const allDocs = liveChecklist.flatMap(section => 
            section.documents.filter(doc => doc.status === 'Verified' || doc.status === 'Submitted')
        );
    };

    const handleScrollToDocument = (doc) => {
        const docId = `doc-${doc.ownerId}-${doc.name.replace(/[\s/]/g, '-')}`;
        const element = document.getElementById(docId);
        if (element) {
            // Ensure the parent checklist section is expanded
            setExpandedChecklist(prev => ({ ...prev, [doc.ownerId]: true }));
            
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add(darkMode ? 'bg-yellow-800/30' : 'bg-yellow-100', 'ring-2', 'ring-yellow-500');
                setTimeout(() => {
                    element.classList.remove(darkMode ? 'bg-yellow-800/30' : 'bg-yellow-100', 'ring-2', 'ring-yellow-500');
                }, 2500);
            }, 100); // Small delay to allow for section expansion
        }
    };
    
    const canEditCase = hasPermission(currentUser.role, 'canEditAllCases', userRoles) || 
                        (hasPermission(currentUser.role, 'canEditAssignedCases', userRoles) && onboardingCase.assignedTo === currentUser.userId);
    
    const assignedUser = users.find(u => u.userId === onboardingCase.assignedTo);

    const handleRevertAndClose = (documentId, versionToRevert) => {
        onRevertDocument(onboardingCase.caseId, documentId, versionToRevert);
        setHistoryModalData(null); // Close modal here
    };

    return (<> 
        <AddPartyModal isOpen={isAddPartyModalOpen} onClose={() => setIsAddPartyModalOpen(false)} onAddParty={onAddParty} darkMode={darkMode} masterIndividuals={allData.masterIndividuals} entityType={onboardingCase.entity.entityType} /> 
        <UpdateCaseModal isOpen={isUpdateCaseModalOpen} onClose={() => setIsUpdateCaseModalOpen(false)} onUpdateCase={onUpdateCase} caseData={onboardingCase} darkMode={darkMode} />
        <TaskAssignmentModal isOpen={isTaskAssignModalOpen} onClose={() => setIsTaskAssignModalOpen(false)} onAssign={handleTaskAssign} users={users} currentAssignee={onboardingCase.assignedTo} darkMode={darkMode} userRoles={userRoles} />
        <DocumentHistoryModal 
            isOpen={!!historyModalData} 
            onClose={() => setHistoryModalData(null)} 
            document={historyModalData} 
            darkMode={darkMode}
            canRevert={hasPermission(currentUser.role, 'canRevertDocs', userRoles)}
            onRevert={handleRevertAndClose}
        />
        <DocumentPreviewModal
            isOpen={!!previewModalData}
            onClose={() => setPreviewModalData(null)}
            document={previewModalData}
            darkMode={darkMode}
        />
        
        <div className="space-y-8">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <button onClick={onBack} className={`flex items-center gap-2 text-sm mb-4 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}><ChevronLeft size={16} /> Back to Cases</button>
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{onboardingCase.entity.entityName}</h2>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{onboardingCase.entity.entityType} &bull; Case ID: {onboardingCase.caseId}</p>
                        {assignedUser && <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Assigned to: <span className="font-medium">{assignedUser.name}</span></p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <StatusBadge status={onboardingCase.status} darkMode={darkMode} />
                            <RiskBadge riskLevel={onboardingCase.riskLevel} darkMode={darkMode} />
                            <SLABadge deadline={onboardingCase.slaDeadline} darkMode={darkMode} />
                        </div>
                        <div className="flex gap-2 mt-2">
                            {hasPermission(currentUser.role, 'canAssignTasks', userRoles) && <button onClick={() => setIsTaskAssignModalOpen(true)} className="text-xs flex items-center gap-1 text-blue-500 hover:underline"><UserPlus size={12}/>Assign</button>}
                            {canEditCase && <button onClick={() => setIsUpdateCaseModalOpen(true)} className="text-xs flex items-center gap-1 text-blue-500 hover:underline"><Edit size={12}/>Update</button>}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Workflow Progress</h3>
                <WorkflowProgress currentStage={onboardingCase.workflowStage} darkMode={darkMode} />
            </div>

            <CaseOverview liveChecklist={liveChecklist} darkMode={darkMode} onScrollToDocument={handleScrollToDocument} />

            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex -mb-px overflow-x-auto">
                        <button onClick={() => setActiveTab('checklist')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='checklist' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Onboarding Checklist</button>
                        <button onClick={() => setActiveTab('profile')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='profile' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Entity Profile</button>
                        <button onClick={() => setActiveTab('credit')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='credit' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Credit Details</button>
                        <button onClick={() => setActiveTab('reports')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='reports' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Call Reports</button>
                        <button onClick={() => setActiveTab('ad-hoc')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='ad-hoc' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Ad-Hoc Docs</button>
                        <button onClick={() => setActiveTab('activity')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 ${activeTab==='activity' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>Activity</button>
                    </div>
                </div>
                <div className="pt-6">
                  {activeTab === 'checklist' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Related Parties</h3>
                                        {canEditCase && <button onClick={() => setIsAddPartyModalOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}><Plus size={14}/>Add Party</button>}
                                    </div>
                                    <div className="space-y-4">{onboardingCase.relatedPartyLinks.map(partyLink => {
                                        const party = allData.masterIndividuals.find(p => p.partyId === partyLink.partyId);
                                        if(!party) return null;
                                        return (<div key={party.partyId} className={`p-4 rounded-lg flex items-center justify-between ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}><div className="flex items-center space-x-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}><User size={20} className={`${darkMode ? 'text-slate-300' : 'text-gray-500'}`} /></div><div><button onClick={() => onSelectParty(party.partyId)} className={`font-medium text-left ${darkMode ? 'text-slate-100 hover:underline' : 'text-gray-800 hover:underline'}`}>{party.name}</button><p className="text-xs text-gray-500">{partyLink.relationships.map(r => `${r.type}${r.ownershipPercentage ? ` (${r.ownershipPercentage}%)` : ''}`).join(', ')}</p></div></div><div className="flex items-center space-x-2" title={isPartyKycComplete(party.partyId) ? 'KYC Complete' : 'KYC Incomplete'}><span className={`h-3 w-3 rounded-full ${isPartyKycComplete(party.partyId) ? 'bg-green-500' : 'bg-red-500'}`} /></div></div>)
                                    })}</div>
                                </div>
                                <ScannerProfilePanel darkMode={darkMode} profiles={mockScannerProfiles} selectedProfile={allData.selectedScannerProfile} onProfileChange={allData.setSelectedScannerProfile} />
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Document Checklist</h3>
                                        <div className="flex gap-2">
                                            <button onClick={handleDownloadSelected} disabled={selectedDocuments.length === 0} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedDocuments.length > 0 ? (darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white') : (darkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-400')}`}><Download size={14}/>Download Selected ({selectedDocuments.length})</button>
                                            <button onClick={handleDownloadAll} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}><FileDown size={14}/>Download All</button>
                                            <button onClick={() => setShowEmailModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${darkMode ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}><Mail size={14}/>Email</button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">{liveChecklist.map((section) => (<div key={section.ownerId}><button onClick={() => toggleChecklistSection(section.ownerId)} className={`w-full text-md font-semibold mb-3 flex items-center gap-2 text-left ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{expandedChecklist[section.ownerId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<span>{section.category}</span></button>{expandedChecklist[section.ownerId] && <div className="space-y-2 pl-8">{section.documents.map((doc, index) => (<DocumentRequirement key={doc.name + index} document={doc} darkMode={darkMode} onUpload={onSaveDocument} onScan={onScanDocument} ownerId={section.ownerId} onSelect={handleDocumentSelect} isSelected={selectedDocuments.some(d => d.name === doc.name)} canUpload={hasPermission(currentUser.role, 'canUploadDocs', userRoles)} onShowHistory={setHistoryModalData} onPreview={setPreviewModalData} masterDocuments={allData.masterDocuments} onLinkDocument={onLinkDocument} caseId={onboardingCase.caseId} allData={allData} />))}</div>}</div>))}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Entity Profile Details</h3>
                                {canEditCase && (isEditingEntity ? <button onClick={handleEntitySave} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}><Save size={16}/>Save Changes</button> : <button onClick={() => setIsEditingEntity(true)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}><Edit size={16}/>Edit Profile</button>)}
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField label="Entity Name" value={entityEditData.entityName} isEditing={isEditingEntity} onChange={e => handleEntityChange('entityName', e.target.value)} darkMode={darkMode} />
                                    <FormField label="Basic Number" value={entityEditData.basicNumber} isEditing={isEditingEntity} onChange={e => handleEntityChange('basicNumber', e.target.value)} darkMode={darkMode} />
                                    <FormField label="CIS Number" value={entityEditData.cisNumber} isEditing={isEditingEntity} onChange={e => handleEntityChange('cisNumber', e.target.value)} darkMode={darkMode} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField label="Address Line 1" value={entityEditData.address1} isEditing={isEditingEntity} onChange={e => handleEntityChange('address1', e.target.value)} darkMode={darkMode} />
                                    <FormField label="Address Line 2" value={entityEditData.address2} isEditing={isEditingEntity} onChange={e => handleEntityChange('address2', e.target.value)} darkMode={darkMode} />
                                    <FormField label="Country" value={entityEditData.addressCountry} isEditing={isEditingEntity} onChange={e => handleEntityChange('addressCountry', e.target.value)} darkMode={darkMode} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField label="Place of Incorporation" value={entityEditData.placeOfIncorporation} isEditing={isEditingEntity} onChange={e => handleEntityChange('placeOfIncorporation', e.target.value)} darkMode={darkMode} />
                                    <FormField label="Tax ID" value={entityEditData.taxId} isEditing={isEditingEntity} onChange={e => handleEntityChange('taxId', e.target.value)} darkMode={darkMode} />
                                    <FormField label="FATCA Classification" value={entityEditData.usFatcaClassificationFinal} isEditing={isEditingEntity} onChange={e => handleEntityChange('usFatcaClassificationFinal', e.target.value)} darkMode={darkMode} />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'credit' && (
                        <CreditDetailsView 
                            caseData={onboardingCase} 
                            darkMode={darkMode} 
                            onUpdateCreditDetails={(creditData) => onUpdateCreditDetails(onboardingCase.caseId, creditData)}
                            onSaveDocument={onSaveDocument}
                            onShowHistory={setHistoryModalData}
                            currentUser={currentUser}
                            userRoles={userRoles}
                        />
                    )}
                    {activeTab === 'reports' && (
                        <CallReportsView 
                            caseData={onboardingCase}
                            darkMode={darkMode}
                            onAddCallReport={(reportData) => onAddCallReport(onboardingCase.caseId, reportData)}
                        />
                    )}
                    {activeTab === 'ad-hoc' && (
                        <AdditionalDocumentsView
                            title="Other Ad-Hoc Documents"
                            docType="ad-hoc"
                            documents={[]} // TODO: Refactor ad-hoc docs
                            ownerId={onboardingCase.caseId}
                            onSaveDocument={onSaveDocument}
                            onShowHistory={setHistoryModalData}
                            darkMode={darkMode}
                            currentUser={currentUser}
                            userRoles={userRoles}
                        />
                    )}
                    {activeTab === 'activity' && (
                        <ActivityLog activities={onboardingCase.activities || []} users={users} darkMode={darkMode} />
                    )}
                </div>
            </div>
        </div>
    </>);
};

const IndividualProfileView = ({ partyId, allCases, masterIndividuals, masterDocuments, onBack, onSaveDocument, darkMode, onUpdateParty, onNavigateToCase, currentUser, userRoles }) => {
    const person = masterIndividuals.find(p => p.partyId === partyId);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(person);

    useEffect(() => { setEditData(person) }, [person]);

    const relatedCases = allCases.filter(c => (c.relatedPartyLinks || []).some(p => p.partyId === partyId));
    
    const individualDocuments = useMemo(() => {
        if (!person) return [];
        return masterDocuments
            .filter(doc => doc.ownerId === person.partyId)
            .map(doc => ({
                ...doc.versions[doc.versions.length - 1], // Get latest version details
                name: doc.name,
                versions: doc.versions,
                ownerId: doc.ownerId,
            }));
    }, [masterDocuments, person]);

    if (!person) return <div>Person not found.</div>;

    const handleSave = () => { onUpdateParty(editData); setIsEditing(false); };
    const handleChange = (field, value) => setEditData(prev => ({...prev, [field]: value}));
    
    const canEditParty = hasPermission(currentUser.role, 'canEditAllCases', userRoles) || hasPermission(currentUser.role, 'canEditAssignedCases', userRoles);

    return (
        <div className="space-y-8">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <button onClick={onBack} className={`flex items-center gap-2 text-sm mb-4 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}><ChevronLeft size={16} /> Back to Case</button>
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                                <User size={32} className={`${darkMode ? 'text-slate-300' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{person.name}</h2>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{person.residencyStatus} &bull; Party ID: {person.partyId}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        {canEditParty && (isEditing ? 
                            <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}><Save size={16}/>Save</button> : 
                            <button onClick={() => setIsEditing(true)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}><Edit size={16}/>Edit</button>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Details</h3>
                        <div className="space-y-4">
                            <FormField label="First Name" value={editData.firstName} isEditing={isEditing} onChange={e => handleChange('firstName', e.target.value)} darkMode={darkMode} />
                            <FormField label="Last Name" value={editData.lastName} isEditing={isEditing} onChange={e => handleChange('lastName', e.target.value)} darkMode={darkMode} />
                            <FormField label="Birth Date" value={editData.birthDate} isEditing={isEditing} onChange={e => handleChange('birthDate', e.target.value)} darkMode={darkMode} />
                            <FormField label="Identity No." value={editData.identityNo} isEditing={isEditing} onChange={e => handleChange('identityNo', e.target.value)} darkMode={darkMode} />
                            <FormField label="Employment Status" value={editData.employmentStatus} isEditing={isEditing} onChange={e => handleChange('employmentStatus', e.target.value)} darkMode={darkMode} />
                            <FormField label="Employer" value={editData.employerName} isEditing={isEditing} onChange={e => handleChange('employerName', e.target.value)} darkMode={darkMode} />
                        </div>
                    </div>
                    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Related Entities</h3>
                        <div className="space-y-4">
                            {relatedCases.map(c => { 
                                const relationship = (c.relatedPartyLinks || []).find(p => p.partyId === partyId)?.relationships; 
                                return (
                                    <button key={c.caseId} onClick={() => onNavigateToCase(c.caseId)} className={`w-full p-4 rounded-lg text-left ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                        <p className={`font-medium ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>{c.entity.entityName}</p>
                                        <p className="text-xs text-gray-500">{relationship?.map(r => r.type).join(', ')}</p>
                                    </button>
                                ); 
                            })}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Master Document List</h3>
                         <div className="space-y-2">
                            {individualDocuments.length > 0 ? (
                                individualDocuments.map((doc, index) => (
                                    <DocumentRequirement
                                        key={index}
                                        document={doc}
                                        darkMode={darkMode}
                                        onUpload={onSaveDocument}
                                        ownerId={partyId}
                                        canUpload={hasPermission(currentUser.role, 'canUploadDocs', userRoles)}
                                        // onShowHistory can be added here if needed
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No master documents found for this individual.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PermissionsManager = ({ userRoles, onPermissionChange, darkMode }) => {
    const allPermissionKeys = useMemo(() => {
        const keys = new Set();
        Object.values(userRoles).forEach(role => {
            Object.keys(role.permissions).forEach(key => keys.add(key));
        });
        return Array.from(keys).sort();
    }, [userRoles]);

    return (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Role Permissions</h3>
            <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th className="p-3 text-left font-semibold sticky left-0 z-10 bg-inherit">Role</th>
                            {allPermissionKeys.map(key => (
                                <th key={key} className="p-3 text-center font-semibold">
                                    <span className="inline-block capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^can /, '')}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(userRoles).map(([roleName, roleData]) => (
                            <tr key={roleName} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                <td className={`p-3 font-medium sticky left-0 z-10 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{roleData.label}</td>
                                {allPermissionKeys.map(permissionKey => (
                                    <td key={permissionKey} className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded"
                                            checked={!!roleData.permissions[permissionKey]}
                                            onChange={(e) => onPermissionChange(roleName, permissionKey, e.target.checked)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <p className={`text-xs mt-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Note: Permission changes are for this session only and will reset on page refresh.
            </p>
        </div>
    );
};


const UserManagementView = ({ users, onUpdateUser, onAddUser, darkMode, currentUser, userRoles, onPermissionChange }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  const AddUserModal = ({ isOpen, onClose, onAdd, darkMode }) => {
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Viewer', department: '', password: '' });
    
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onAdd(formData);
      onClose();
      setFormData({ name: '', email: '', role: 'Viewer', department: '', password: '' });
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className={`p-6 rounded-xl border w-full max-w-md ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>
                {Object.entries(userRoles).map(([role, data]) => <option key={role} value={role}>{data.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temporary Password</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500">Add User</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <AddUserModal isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} onAdd={onAddUser} darkMode={darkMode} />
      
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>User & Role Management</h2>
        {hasPermission(currentUser.role, 'canManageUsers', userRoles) && (
          <button onClick={() => setShowAddUserModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <UserPlus size={16}/>Add User
          </button>
        )}
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex -mb-px">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab==='users' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}><Users size={16}/>Users</button>
          <button onClick={() => setActiveTab('permissions')} className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab==='permissions' ? (darkMode ? 'border-yellow-400 text-yellow-400' : 'border-blue-600 text-blue-700') : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'}`}><Lock size={16}/>Permissions</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <table className="w-full text-sm">
              <thead className={`${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Department</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.userId} className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                        {userRoles[user.role]?.label}
                      </span>
                    </td>
                    <td className="p-4">{user.department}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'
                      }`}>
                        {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {hasPermission(currentUser.role, 'canManageUsers', userRoles) && user.userId !== currentUser.userId && (
                        <button 
                          onClick={() => onUpdateUser(user.userId, { isActive: !user.isActive })}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'permissions' && (
        <PermissionsManager userRoles={userRoles} onPermissionChange={onPermissionChange} darkMode={darkMode} />
      )}
    </div>
  );
};

const ReviewQueueView = ({ cases, onSelectCase, darkMode, currentUser, onApprove, onReject, users, userRoles }) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCaseForApproval, setSelectedCaseForApproval] = useState(null);
  
  const pendingCases = cases.filter(c => 
    c.status === 'Pending Approval' && 
    (hasPermission(currentUser.role, 'canApprove', userRoles) || hasPermission(currentUser.role, 'canReviewAndPublish', userRoles))
  );
  
  const handleOpenApprovalModal = (caseData) => {
    setSelectedCaseForApproval(caseData);
    setShowApprovalModal(true);
  };
  
  return (
    <div className="space-y-6">
      <ApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => setShowApprovalModal(false)} 
        onApprove={(comments) => onApprove(selectedCaseForApproval.caseId, comments)} 
        onReject={(comments) => onReject(selectedCaseForApproval.caseId, comments)} 
        caseData={selectedCaseForApproval || {entity:{}}} 
        darkMode={darkMode} 
      />
      
      <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Queue</h2>
        <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Cases pending your approval: {pendingCases.length}
        </p>
        
        {pendingCases.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
            <p>No cases pending your approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCases.map(c => {
              const assignedUser = users.find(u => u.userId === c.assignedTo);
              return (
                <div key={c.caseId} className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {c.entity.entityName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {c.caseId} • {c.entity.entityType} • Submitted by {assignedUser?.name || 'Unknown'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <RiskBadge riskLevel={c.riskLevel} darkMode={darkMode} />
                        <SLABadge deadline={c.slaDeadline} darkMode={darkMode} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onSelectCase(c)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleOpenApprovalModal(c)}
                        className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-500"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentPreviewModal = ({ isOpen, onClose, document, darkMode }) => {
    if (!isOpen) return null;

    const isImage = document?.mimeType?.startsWith('image/');
    const isPdf = document?.mimeType === 'application/pdf';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className={`p-4 rounded-xl border w-full max-w-3xl max-h-[90vh] flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{document.name} (v{document.version})</h3>
                    <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                    {isImage && <img src={`https://placehold.co/800x1100/EEE/31343C?text=Preview:${document.name.replace(/\s/g, '+')}`} alt={`Preview of ${document.name}`} className="max-w-full max-h-full object-contain" />}
                    {isPdf && <div className="text-center p-8">
                        <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                        <h4 className="text-lg font-semibold">PDF Preview</h4>
                        <p className="text-gray-500">A PDF viewer would be rendered here.</p>
                        <p className="text-sm mt-2">File: {document.fileRef}</p>
                    </div>}
                    {!isImage && !isPdf && <div className="text-center p-8">
                        <p>No preview available for this file type ({document.mimeType}).</p>
                    </div>}
                </div>
            </div>
        </div>
    );
};


// ===== 5. MAIN APPLICATION COMPONENT =====
export default function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedCase, setSelectedCase] = useState(null);
    const [selectedPartyId, setSelectedPartyId] = useState(null);
    
    // State now holds the separate, normalized data collections
    const [cases, setCases] = useState(mockCases);
    const [masterIndividuals, setMasterIndividuals] = useState(mockMasterIndividuals);
    const [masterDocuments, setMasterDocuments] = useState(mockMasterDocuments);
    const [caseDocumentLinks, setCaseDocumentLinks] = useState(mockCaseDocumentLinks);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ riskLevel: 'all', status: 'all', assignedTo: 'all' });
    const [templates, setTemplates] = useState(documentRequirementsTemplate);
    const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
    const [users, setUsers] = useState(mockUsers);
    const [userRoles, setUserRoles] = useState(initialUserRoles);
    const [currentUser, setCurrentUser] = useState(mockUsers[0]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedScannerProfile, setSelectedScannerProfile] = useState(mockScannerProfiles[0].id);

    // This object bundles all data to pass to functions, simulating a database context
    const allData = {
        template: templates,
        masterDocuments,
        caseDocumentLinks,
        masterIndividuals,
        cases,
        users,
        selectedScannerProfile,
        setSelectedScannerProfile
    };

    const handleSelectCase = (caseData) => { setSelectedCase(caseData); setActiveView('cases'); };
    const handleBackToCases = () => setSelectedCase(null);
    const handleSelectParty = (partyId) => setSelectedPartyId(partyId);
    const handleBackToCaseDetail = () => setSelectedCase(null);
    
    const handleAddActivity = (caseId, activity) => {
        const newActivity = {
            activityId: crypto.randomUUID(),
            performedBy: currentUser.userId,
            timestamp: new Date().toISOString(),
            ...activity
        };
        
        setCases(currentCases => currentCases.map(c => {
            if (c.caseId === caseId) {
                const updatedCase = { ...c, activities: [...(c.activities || []), newActivity] };
                if (selectedCase?.caseId === caseId) {
                    setSelectedCase(updatedCase);
                }
                return updatedCase;
            }
            return c;
        }));
    };

    const handleLinkDocument = ({ caseId, documentId }) => {
        const linkExists = caseDocumentLinks.some(l => l.caseId === caseId && l.documentId === documentId);
        if (linkExists) return;

        const masterDoc = masterDocuments.find(d => d.documentId === documentId);
        if (!masterDoc) return;
        
        const latestVersion = masterDoc.versions[masterDoc.versions.length - 1];

        const newLink = {
            linkId: crypto.randomUUID(),
            caseId: caseId,
            documentId: documentId,
            versionId: latestVersion.id, // Link to the specific latest version
            status: 'Verified', // Business rule: auto-verify linked docs
            comments: 'Linked from existing verified master document.'
        };
        setCaseDocumentLinks(prev => [...prev, newLink]);
        
        handleAddActivity(caseId, { type: 'document_linked', details: `Linked existing document: ${masterDoc.name}` });
    };

    const handleSaveDocument = (uploadData) => {
        const { ownerId, docName, docDetails, scanDetails } = uploadData;
        const caseId = selectedCase?.caseId;
        if (!caseId) return;

        let masterDoc = masterDocuments.find(d => d.ownerId === ownerId && d.name === docName);
        let newVersionNumber = 1;

        if (masterDoc) {
            newVersionNumber = masterDoc.versions.length + 1;
        } else {
            masterDoc = {
                documentId: `DOC-${crypto.randomUUID()}`,
                ownerId: ownerId,
                name: docName,
                versions: []
            };
            setMasterDocuments(prev => [...prev, masterDoc]);
        }
        
        const newVersion = {
            id: crypto.randomUUID(),
            version: newVersionNumber,
            status: 'Submitted',
            uploadedBy: currentUser.userId,
            uploadedDate: new Date().toISOString(),
            ...docDetails,
            ...(scanDetails && { scanDetails }) // Add scan details if they exist
        };

        setMasterDocuments(prev => prev.map(d => 
            d.documentId === masterDoc.documentId 
                ? { ...d, versions: [...d.versions, newVersion] } 
                : d
        ));

        let link = caseDocumentLinks.find(l => l.caseId === caseId && l.documentId === masterDoc.documentId);
        if (link) {
            setCaseDocumentLinks(prev => prev.map(l => 
                l.linkId === link.linkId 
                    ? { ...l, status: 'Submitted', versionId: newVersion.id, comments: docDetails.comments || null } 
                    : l
            ));
        } else {
            link = {
                linkId: crypto.randomUUID(),
                caseId: caseId,
                documentId: masterDoc.documentId,
                versionId: newVersion.id,
                status: 'Submitted',
                comments: docDetails.comments || null
            };
            setCaseDocumentLinks(prev => [...prev, link]);
        }
        
        const activityType = scanDetails ? 'document_scanned' : 'document_uploaded';
        const activityDetails = scanDetails 
            ? `Scanned new version for document: ${docName}`
            : `Uploaded new version for document: ${docName}`;
        handleAddActivity(caseId, { type: activityType, details: activityDetails });
    };

    const handleScanDocument = ({ ownerId, docName, scanDetails }) => {
        const profile = mockScannerProfiles.find(p => p.id === selectedScannerProfile);
        const fullScanDetails = {
            scanTimestamp: new Date().toISOString(),
            scannerProfile: profile.name,
            resolution: profile.resolution,
            colorMode: profile.colorMode,
            source: profile.source,
            scannedBy: currentUser.name,
            outputFormat: scanDetails.fileType,
        };
        handleSaveDocument({ ownerId, docName, docDetails: { comments: scanDetails.comments, expiryDate: scanDetails.expiryDate }, scanDetails: fullScanDetails });
    };

    const handleRevertDocument = (caseId, documentId, versionToRevert) => {
        setCaseDocumentLinks(prevLinks => prevLinks.map(link => {
            if (link.caseId === caseId && link.documentId === documentId) {
                return { ...link, versionId: versionToRevert.id, status: 'Verified' }; // Revert and set status
            }
            return link;
        }));
        const doc = masterDocuments.find(d => d.documentId === documentId);
        handleAddActivity(caseId, {
            type: 'document_reverted',
            details: `Reverted document '${doc.name}' to version ${versionToRevert.version}.`
        });
    };

    const handleAddParty = (partyData) => {
        const isNewCreation = !partyData.partyId;
        const newPartyId = isNewCreation ? `PARTY-${crypto.randomUUID()}` : partyData.partyId;
    
        if (isNewCreation) {
            const masterRecord = {
                partyId: newPartyId,
                name: partyData.name,
                firstName: partyData.name.split(' ')[0] || '',
                lastName: partyData.name.split(' ').slice(1).join(' ') || '',
                residencyStatus: partyData.residencyStatus,
            };
            setMasterIndividuals(prev => [...prev, masterRecord]);
        }
    
        let updatedCase = null;
    
        const updatedCases = cases.map(c => {
            if (c.caseId === selectedCase.caseId) {
                const newLink = { partyId: newPartyId, relationships: partyData.relationships };
                updatedCase = {
                    ...c,
                    relatedPartyLinks: [...(c.relatedPartyLinks || []), newLink]
                };
                handleAddActivity(updatedCase.caseId, { type: 'party_added', details: `Added new related party: ${partyData.name}` });
                return updatedCase;
            }
            return c;
        });
        setCases(updatedCases);
    
        if (updatedCase) {
            setSelectedCase(updatedCase);
        }
    };

    const handleCreateCase = (newCaseData) => {
        const newCase = { 
            caseId: `CASE-${crypto.randomUUID()}`, 
            status: newCaseData.status, 
            riskLevel: newCaseData.riskLevel, 
            assignedTo: currentUser.userId,
            createdDate: new Date().toISOString(),
            slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            workflowStage: 'prospect',
            approvalChain: newCaseData.riskLevel === 'High' ? ['USER-002', 'USER-001'] : ['USER-002'],
            entity: { customerId: `CUST-${crypto.randomUUID()}`, entityName: newCaseData.entityName, entityType: newCaseData.entityType }, 
            relatedPartyLinks: [],
            activities: [{
                activityId: crypto.randomUUID(),
                type: 'case_created',
                performedBy: currentUser.userId,
                timestamp: new Date().toISOString(),
                details: `Case created for ${newCaseData.entityName}`
            }]
        };
        setCases(prevCases => [newCase, ...prevCases]);
        handleSelectCase(newCase);
    };

    const handleUpdateCase = (updateData) => {
        setCases(currentCases => currentCases.map(c => {
            if (c.caseId === selectedCase.caseId) {
                const newCase = JSON.parse(JSON.stringify(c));
                newCase.status = updateData.status;
                newCase.riskLevel = updateData.riskLevel;
                newCase.entity.basicNumber = updateData.basicNumber;
                newCase.entity.cisNumber = updateData.cisNumber;
                newCase.approvedBy = updateData.approvedBy;
                
                if (updateData.status === 'KYC Review') newCase.workflowStage = 'kyc_review';
                else if (updateData.status === 'Pending Approval') newCase.workflowStage = 'pending_approval';
                else if (updateData.status === 'Active') newCase.workflowStage = 'completed';
                else if (updateData.status === 'Rejected') newCase.workflowStage = 'rejected';

                handleAddActivity(newCase.caseId, { type: 'case_updated', details: `Case status updated to ${updateData.status}` });
                return newCase;
            }
            return c;
        }));
    };
    
    const handleUpdateEntity = (updatedEntityData) => {
        setCases(currentCases => currentCases.map(c => {
            if (c.caseId === selectedCase.caseId) {
                const newCase = { ...c, entity: { ...c.entity, ...updatedEntityData } };
                handleAddActivity(newCase.caseId, { type: 'profile_updated', details: `Entity profile updated.` });
                return newCase;
            }
            return c;
        }));
    };

    const handleUpdateParty = (updatedPartyData) => {
        setMasterIndividuals(prev => prev.map(p => p.partyId === updatedPartyData.partyId ? updatedPartyData : p));
    };
    
    const handleNavigateToCaseFromParty = (caseId) => {
        const caseToSelect = cases.find(c => c.caseId === caseId);
        if (caseToSelect) {
            setSelectedCase(caseToSelect);
            setSelectedPartyId(null);
            setActiveView('cases');
        }
    };
    
    const handleAssignTask = (caseId, userId) => {
        setCases(currentCases => currentCases.map(c => 
            c.caseId === caseId ? { ...c, assignedTo: userId } : c
        ));
        if (selectedCase?.caseId === caseId) {
            setSelectedCase(current => ({ ...current, assignedTo: userId }));
        }
        handleAddActivity(caseId, { type: 'task_assigned', details: `Case assigned to ${users.find(u => u.userId === userId)?.name}` });
    };
    
    const handleApproveCase = (caseId, comments) => {
        setCases(currentCases => currentCases.map(c => {
            if (c.caseId === caseId) {
                return { ...c, status: 'Active', workflowStage: 'completed', approvedBy: currentUser.userId };
            }
            return c;
        }));
        handleAddActivity(caseId, { type: 'case_approved', details: `Case approved: ${comments}` });
    };
    
    const handleRejectCase = (caseId, comments) => {
        setCases(currentCases => currentCases.map(c => {
            if (c.caseId === caseId) {
                return { ...c, status: 'Rejected', workflowStage: 'rejected' };
            }
            return c;
        }));
        handleAddActivity(caseId, { type: 'case_rejected', details: `Case rejected: ${comments}` });
    };
    
    const handleAddUser = (userData) => {
        const newUser = {
            userId: `USER-${crypto.randomUUID()}`,
            isActive: true,
            ...userData
        };
        setUsers(prev => [...prev, newUser]);
    };
    
    const handleUpdateUser = (userId, updates) => {
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...updates } : u));
    };

    const handlePermissionChange = (roleName, permissionKey, value) => {
        setUserRoles(currentRoles => {
            const newRoles = JSON.parse(JSON.stringify(currentRoles));
            if(newRoles[roleName]) {
                newRoles[roleName].permissions[permissionKey] = value;
            }
            return newRoles;
        });
    };

    const handleUpdateCreditDetails = (caseId, creditData) => {
        setCases(prev => prev.map(c => c.caseId === caseId ? {...c, entity: {...c.entity, creditDetails: creditData}} : c));
        if (selectedCase?.caseId === caseId) {
            setSelectedCase(prev => ({...prev, entity: {...prev.entity, creditDetails: creditData}}));
        }
    };

    const handleAddCallReport = (caseId, reportData) => {
        setCases(prev => prev.map(c => {
            if (c.caseId === caseId) {
                return { ...c, callReports: [...(c.callReports || []), reportData] };
            }
            return c;
        }));
    };

    const filteredCases = useMemo(() => {
        const searchTerms = searchTerm.toLowerCase().split(',').map(term => term.trim()).filter(term => term);
        
        return cases.filter(c => {
            const riskMatch = filters.riskLevel === 'all' || c.riskLevel === filters.riskLevel;
            const statusMatch = filters.status === 'all' || c.status === filters.status;
            const assigneeMatch = filters.assignedTo === 'all' || c.assignedTo === filters.assignedTo;
            const permissionMatch = hasPermission(currentUser.role, 'canViewAllCases', userRoles) || c.assignedTo === currentUser.userId;

            if (!permissionMatch || !riskMatch || !statusMatch || !assigneeMatch) {
                return false;
            }
            
            if (searchTerms.length === 0) return true;

            const partyIdsInCase = (c.relatedPartyLinks || []).map(l => l.partyId);
            const partiesInCase = masterIndividuals.filter(p => partyIdsInCase.includes(p.partyId));

            return searchTerms.some(term => 
                c.entity.entityName.toLowerCase().includes(term) ||
                c.caseId.toLowerCase().includes(term) ||
                partiesInCase.some(p => p.name.toLowerCase().includes(term))
            );
        });
    }, [cases, masterIndividuals, searchTerm, filters, currentUser, userRoles]);

    const myTasks = useMemo(() => {
        return cases.filter(c => 
            (c.assignedTo === currentUser.userId && c.status !== 'Active' && c.status !== 'Rejected') ||
            (c.status === 'Pending Approval' && c.approvalChain.includes(currentUser.userId))
        ).map(c => ({
            ...c,
            taskType: c.status === 'Pending Approval' ? 'Approval Required' : 'Action Required'
        }));
    }, [cases, currentUser.userId]);
    
    const renderContent = () => {
        if (activeView === 'my-tasks') return <MyTasksView tasks={myTasks} onSelectCase={handleSelectCase} darkMode={darkMode} users={users} />;
        if (activeView === 'templates' && hasPermission(currentUser.role, 'canManageTemplates', userRoles)) return <EnhancedTemplateManagerView templates={templates} setTemplates={setTemplates} darkMode={darkMode} />;
        if (activeView === 'dashboard') return <DashboardView cases={filteredCases} onSelectCase={handleSelectCase} darkMode={darkMode} currentUser={currentUser} userRoles={userRoles} allData={allData} />;
        if (activeView === 'users' && hasPermission(currentUser.role, 'canManageUsers', userRoles)) return <UserManagementView users={users} onUpdateUser={handleUpdateUser} onAddUser={handleAddUser} darkMode={darkMode} currentUser={currentUser} userRoles={userRoles} onPermissionChange={handlePermissionChange} />;
        if (activeView === 'queue' && hasPermission(currentUser.role, 'canViewQueue', userRoles)) return <ReviewQueueView cases={cases} onSelectCase={handleSelectCase} darkMode={darkMode} currentUser={currentUser} onApprove={handleApproveCase} onReject={handleRejectCase} users={users} userRoles={userRoles} />;
        if (activeView === 'cases') {
            if (selectedPartyId) { return <IndividualProfileView partyId={selectedPartyId} allCases={cases} masterIndividuals={masterIndividuals} masterDocuments={masterDocuments} onBack={handleBackToCaseDetail} onSaveDocument={handleSaveDocument} onUpdateParty={handleUpdateParty} onNavigateToCase={handleNavigateToCaseFromParty} darkMode={darkMode} currentUser={currentUser} userRoles={userRoles} />; }
            if (selectedCase) { return <CaseDetailView onboardingCase={selectedCase} allData={allData} darkMode={darkMode} onBack={handleBackToCases} onAddParty={handleAddParty} onUpdateCase={handleUpdateCase} onUpdateEntity={handleUpdateEntity} onSelectParty={handleSelectParty} users={users} currentUser={currentUser} onAssignTask={handleAssignTask} onAddActivity={handleAddActivity} userRoles={userRoles} onRevertDocument={handleRevertDocument} onUpdateCreditDetails={handleUpdateCreditDetails} onSaveDocument={handleSaveDocument} onAddCallReport={handleAddCallReport} onLinkDocument={handleLinkDocument} onScanDocument={handleScanDocument} />; }
            return <CasesListView cases={filteredCases} onSelectCase={handleSelectCase} searchTerm={searchTerm} setSearchTerm={setSearchTerm} darkMode={darkMode} onNewCase={() => setIsNewCaseModalOpen(true)} currentUser={currentUser} userRoles={userRoles} filters={filters} setFilters={setFilters} allUsers={users} />;
        }
        return <DashboardView cases={filteredCases} onSelectCase={handleSelectCase} darkMode={darkMode} currentUser={currentUser} userRoles={userRoles} allData={allData} />;
    };
    
    const DashboardView = ({ cases, onSelectCase, darkMode, currentUser, userRoles, allData }) => {
        const overdueDocCount = calculateOverdueDocuments(cases, allData);
        
        return (
            <div className="space-y-8">
                <div className="mb-6">
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back, {currentUser.name}</h2>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Role: {userRoles[currentUser.role]?.label}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <MetricCard icon={Building2} title="Total Cases" value={cases.length} trend="+2 this week" darkMode={darkMode} />
                    <MetricCard icon={TrendingUp} title="Cases In Progress" value={cases.filter(c => c.status === 'KYC Review').length} trend="+1" darkMode={darkMode} />
                    <MetricCard icon={AlertTriangle} title="Overdue Cases" value={cases.filter(c => calculateSLAStatus(c.slaDeadline)?.status === 'overdue').length} darkMode={darkMode} />
                    <MetricCard icon={FileText} title="Expired Documents" value={overdueDocCount} trend={overdueDocCount > 0 ? `Needs attention` : null} darkMode={darkMode} />
                    <MetricCard icon={CheckCircle} title="Active Accounts" value={cases.filter(c => c.status === 'Active').length} trend="+1" darkMode={darkMode} />
                </div>
                <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                    <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                        {cases.slice(0, 5).map(c => (
                            <div key={c.caseId} onClick={() => onSelectCase(c)} className="p-4 flex justify-between items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                <div>
                                    <p className={`font-medium ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>{c.entity.entityName}</p>
                                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{c.caseId} • {c.entity.entityType}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={c.status} darkMode={darkMode} />
                                    <SLABadge deadline={c.slaDeadline} darkMode={darkMode} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    
    const CasesListView = ({ cases, onSelectCase, searchTerm, setSearchTerm, darkMode, onNewCase, currentUser, userRoles, filters, setFilters, allUsers }) => {

        return (
        <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Onboarding Cases</h2>
                    {(hasPermission(currentUser.role, 'canEditAllCases', userRoles) || hasPermission(currentUser.role, 'canEditAssignedCases', userRoles)) && (
                        <button onClick={onNewCase} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}><Plus size={16}/> New Case</button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-4">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                        <input type="text" placeholder="Search by name, case ID, related party (use commas for multiple terms)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
                    </div>
                    <select value={filters.riskLevel} onChange={e => setFilters({...filters, riskLevel: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>
                        <option value="all">All Risk Levels</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>
                        <option value="all">All Statuses</option>
                        {Object.keys(workflowStages).map(s => <option key={s} value={workflowStages[s].label}>{workflowStages[s].label}</option>)}
                    </select>
                    <select value={filters.assignedTo} onChange={e => setFilters({...filters, assignedTo: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>
                        <option value="all">All Users</option>
                        {allUsers.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
                    </select>
                </div>
            </div>
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <table className="w-full text-sm text-left">
                    <thead className={`border-b ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                        <tr>
                            <th className="p-4">Entity Name</th>
                            <th className="p-4">Basic No.</th>
                            <th className="p-4">CIS No.</th>
                            <th className="p-4">Risk Level</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">SLA</th>
                            <th className="p-4">Assigned To</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map(c => {
                            const assignedUser = users.find(u => u.userId === c.assignedTo);
                            return (
                                <tr key={c.caseId} onClick={() => onSelectCase(c)} className={`border-b cursor-pointer ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className="p-4 font-medium">{c.entity.entityName}</td>
                                    <td className="p-4 text-gray-500">{c.entity.basicNumber || '-'}</td>
                                    <td className="p-4 text-gray-500">{c.entity.cisNumber || '-'}</td>
                                    <td className="p-4"><RiskBadge riskLevel={c.riskLevel} darkMode={darkMode} /></td>
                                    <td className="p-4"><StatusBadge status={c.status} darkMode={darkMode} /></td>
                                    <td className="p-4"><SLABadge deadline={c.slaDeadline} darkMode={darkMode} /></td>
                                    <td className="p-4 text-gray-500">{assignedUser?.name || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )};

    const MyTasksView = ({ tasks, onSelectCase, darkMode, users }) => (
        <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Tasks ({tasks.length})</h2>
                {tasks.length === 0 ? (
                    <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p>You have no outstanding tasks. Great job!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task.caseId} onClick={() => onSelectCase(task)} className={`p-4 rounded-lg border flex justify-between items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div>
                                    <p className={`font-semibold text-sm ${task.taskType === 'Approval Required' ? (darkMode ? 'text-purple-400' : 'text-purple-600') : (darkMode ? 'text-blue-400' : 'text-blue-600')}`}>{task.taskType}</p>
                                    <p className={`font-medium ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>{task.entity.entityName}</p>
                                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{task.caseId}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <RiskBadge riskLevel={task.riskLevel} darkMode={darkMode} />
                                    <SLABadge deadline={task.slaDeadline} darkMode={darkMode} />
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Navigation links configuration
    const navLinks = [
        { view: 'dashboard', label: 'Dashboard', icon: Home, permission: null },
        { view: 'my-tasks', label: 'My Tasks', icon: ListTodo, permission: null, badge: myTasks.length > 0 ? myTasks.length : 0 },
        { view: 'cases', label: 'Cases', icon: Users, permission: null },
        { view: 'queue', label: 'Review Queue', icon: ClipboardList, permission: 'canViewQueue' },
        { view: 'templates', label: 'Templates', icon: Settings, permission: 'canManageTemplates' },
        { view: 'users', label: 'Users', icon: UserPlus, permission: 'canManageUsers' },
    ];

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
            <NewCaseModal isOpen={isNewCaseModalOpen} onClose={() => setIsNewCaseModalOpen(false)} onCreateCase={handleCreateCase} darkMode={darkMode} />
            
            {/* --- Improved Navigation Bar --- */}
            <header className={`sticky top-0 z-30 transition-colors ${darkMode ? 'bg-slate-900/80 border-slate-700 backdrop-blur-sm' : 'bg-white/80 border-gray-200 backdrop-blur-sm'}`}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Desktop Navigation */}
                        <div className="flex items-center gap-8">
                            <img 
                                src={darkMode ? "https://www.bangkokbank.com/-/media/feature/identity/bbl-corporate/site-logos/logo.svg?iar=0&sc_lang=en&hash=C493D3DC5FBF94ED5448BFE881213ABE" : "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Bangkok_Bank_2023_%28English_version%29.svg/2880px-Bangkok_Bank_2023_%28English_version%29.svg.png"}
                                alt="Bangkok Bank Logo"
                                className="h-8 flex-shrink-0"
                            />
                            <nav className="hidden md:flex items-center gap-2">
                                {navLinks.map(link => {
                                    if(link.permission && !hasPermission(currentUser.role, link.permission, userRoles)) return null;
                                    const Icon = link.icon;
                                    return (
                                        <button 
                                            key={link.view}
                                            onClick={() => { setActiveView(link.view); setSelectedCase(null); setSelectedPartyId(null); }} 
                                            className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === link.view ? (darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100')}`}
                                        >
                                            <Icon size={16}/>
                                            {link.label}
                                            {link.badge > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{link.badge}</span>}
                                        </button>
                                    )
                                })}
                            </nav>
                        </div>

                        {/* Right side controls: User role, Theme, Mobile Menu Button */}
                        <div className="flex items-center gap-4">
                             <div className="relative">
                                <select 
                                    value={currentUser.role} 
                                    onChange={(e) => {
                                        const newRole = e.target.value;
                                        const userWithNewRole = users.find(u => u.role === newRole) || currentUser;
                                        setCurrentUser(userWithNewRole);
                                        setActiveView('dashboard');
                                        setSelectedCase(null);
                                        setSelectedPartyId(null);
                                    }}
                                    className={`appearance-none text-sm rounded-md pl-3 pr-8 py-1.5 border transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                >
                                    {Object.keys(userRoles).map(role => (
                                        <option key={role} value={role}>{userRoles[role].label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                            </div>
                            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                            <div className="md:hidden">
                                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <nav className="flex flex-col p-4 space-y-2">
                            {navLinks.map(link => {
                                if(link.permission && !hasPermission(currentUser.role, link.permission, userRoles)) return null;
                                const Icon = link.icon;
                                return (
                                    <button 
                                        key={link.view}
                                        onClick={() => { setActiveView(link.view); setSelectedCase(null); setSelectedPartyId(null); setIsMobileMenuOpen(false); }} 
                                        className={`relative flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${activeView === link.view ? (darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900') : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100')}`}
                                    >
                                        <Icon size={18}/>
                                        <span>{link.label}</span>
                                        {link.badge > 0 && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{link.badge}</span>}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8">{renderContent()}</main>
        </div>
    );
}
