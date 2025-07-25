// =================================================================================
// FILE: src/features/case/utils/checklist.test.ts
// =================================================================================
import { describe, it, expect } from 'vitest';
import { generateLiveChecklist } from './checklist';
import type { Case, Party, Document, CaseDocumentLink } from '@/types/entities';
import type { DocStatus } from '@/types/enums';

// We'll define a suite of tests for our checklist generation logic
describe('generateLiveChecklist', () => {

  // Test Case 1: A standard Non-Listed Company (from before)
  it('should generate a correct checklist for a Non-Listed Company', () => {
    const mockCase: Case = {
      caseId: "CASE-TEST-01", status: "KYC Review", riskLevel: "High",
      entity: { customerId: "CUST-TEST-01", entityName: "Test Innovations Pte Ltd", entityType: "Non-Listed Company", taxId: 'NA', address1: 'NA', addressCountry: 'NA', placeOfIncorporation: 'NA', usFatcaClassificationFinal: 'NA' },
      relatedPartyLinks: [{ partyId: "PARTY-TEST-01", relationships: [{ type: "Director" }] }],
      createdDate: '', slaDeadline: '', assignedTo: null, workflowStage: '', approvalChain: [], callReports: [], activities: []
    };
    const mockParty: Party = { partyId: "PARTY-TEST-01", name: "Jane Doe", residencyStatus: "Singaporean/PR", firstName: '', lastName: '', idType: '', identityNo: '', birthDate: '', isPEP: false };
    const mockDocuments: Document[] = [
      { documentId: "DOC-ENTITY-01", ownerId: "CUST-TEST-01", name: "Certificate of Incorporation", versions: [{ id: 'v1', version: 1, status: "Verified", uploadedDate: "2024-01-01", fileRef: "N/A", mimeType: 'application/pdf' }] },
      { documentId: "DOC-PARTY-01", ownerId: "PARTY-TEST-01", name: "NRIC / Birth Certificate", versions: [{ id: 'v1-party', version: 1, status: "Verified", uploadedDate: "2024-01-01", fileRef: "N/A", mimeType: 'application/pdf' }] }
    ];
    const mockLinks: CaseDocumentLink[] = [
      { linkId: "LNK-TEST-01", caseId: "CASE-TEST-01", documentId: "DOC-ENTITY-01", versionId: 'v1', status: 'Verified' }
    ];

    const checklist = generateLiveChecklist(mockCase, [mockParty], mockDocuments, mockLinks);

    expect(checklist).toHaveLength(2);
    const entitySection = checklist.find(s => s.category === 'Entity Documents & Forms');
    expect(entitySection).toBeDefined();
    const certOfInc = entitySection!.documents.find(d => d.name === 'Certificate of Incorporation');
    expect(certOfInc?.status).toBe<DocStatus>('Verified');
    const partySection = checklist.find(s => s.category === 'Documents for Jane Doe');
    expect(partySection).toBeDefined();
    const nricDoc = partySection!.documents.find(d => d.name === 'NRIC / Birth Certificate');
    expect(nricDoc?.status).toBe<DocStatus>('Missing');
    expect(nricDoc?.reusableDocument).toBeDefined();
  });


  // Test Case 2: A party who is a Foreigner
  it('should require Passport and Proof of Address for a Foreigner', () => {
    // 1. ARRANGE
    const mockCase: Case = {
        caseId: "CASE-TEST-02", status: "KYC Review", riskLevel: "Low",
        entity: { customerId: "CUST-TEST-02", entityName: "Foreign Branch", entityType: "Non-Listed Company", taxId: 'NA', address1: 'NA', addressCountry: 'NA', placeOfIncorporation: 'NA', usFatcaClassificationFinal: 'NA' },
        relatedPartyLinks: [{ partyId: "PARTY-TEST-02", relationships: [{ type: "Director" }] }],
        createdDate: '', slaDeadline: '', assignedTo: null, workflowStage: '', approvalChain: [], callReports: [], activities: []
    };
    const mockForeignerParty: Party = {
        partyId: "PARTY-TEST-02", name: "John Smith", residencyStatus: "Foreigner",
        firstName: '', lastName: '', idType: '', identityNo: '', birthDate: '', isPEP: false
    };
    const mockDocuments: Document[] = [
        // The foreigner has a Passport and it IS LINKED to the case
        { documentId: "DOC-PARTY-02", ownerId: "PARTY-TEST-02", name: "Passport", versions: [{ id: 'v1-passport', version: 1, status: "Verified", uploadedDate: "2024-01-01", fileRef: "N/A", mimeType: 'application/pdf' }] }
        // Note: There is no "Proof of Residential Address" document at all
    ];
    const mockLinks: CaseDocumentLink[] = [
        { linkId: "LNK-TEST-02", caseId: "CASE-TEST-02", documentId: "DOC-PARTY-02", versionId: 'v1-passport', status: 'Verified' }
    ];

    // 2. ACT
    const checklist = generateLiveChecklist(mockCase, [mockForeignerParty], mockDocuments, mockLinks);

    // 3. ASSERT
    const partySection = checklist.find(s => s.category === 'Documents for John Smith');
    expect(partySection).toBeDefined();

    const passportDoc = partySection!.documents.find(d => d.name === 'Passport');
    const addressDoc = partySection!.documents.find(d => d.name === 'Proof of Residential Address');

    // The linked Passport should be 'Verified'
    expect(passportDoc?.status).toBe<DocStatus>('Verified');

    // The un-linked Proof of Address should be 'Missing'
    expect(addressDoc?.status).toBe<DocStatus>('Missing');
    // And it should not be reusable, since no master document exists for it
    expect(addressDoc?.reusableDocument).toBeUndefined();
  });
});