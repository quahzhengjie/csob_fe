// =================================================================================
// FILE: src/features/party/utils/checklist.ts
// =================================================================================
'use client';

import type { Party, Document, DocumentRequirements, DocStatus, TemplateDoc, UserInfo } from '@/types/entities';
import { getDocumentRequirements } from '@/lib/apiClient';

export interface PartyChecklistDocument {
  id?: string;
  documentId?: number;
  name: string;
  required?: boolean;
  description?: string;
  validityMonths?: number;
  status: DocStatus;
  ownerId: string;
  ownerName: string;
  version?: number;
  uploadedDate?: string;
  expiryDate?: string;
  mimeType?: string;
  rejectionReason?: string;
  comments?: string;
  uploadedBy?: UserInfo | null;
  verifiedBy?: UserInfo | null;
  verifiedDate?: string;
  
  // This holds all versions of this document type
  allVersions?: Document[];
}

export interface PartyChecklistSection {
  category: string;
  documents: PartyChecklistDocument[];
}

// Helper to group documents by type
const groupDocumentsByType = (documents: Document[]): Map<string, Document[]> => {
  const documentMap = new Map<string, Document[]>();
  
  for (const doc of documents) {
    const key = doc.documentType;
    if (!documentMap.has(key)) {
      documentMap.set(key, []);
    }
    documentMap.get(key)!.push(doc);
  }
  
  // Sort versions within each group (latest first)
  documentMap.forEach(versions => versions.sort((a, b) => b.version - a.version));
  
  return documentMap;
};

export const generatePartyChecklist = async (
  party: Party,
  uploadedDocuments: Document[],
): Promise<PartyChecklistSection[]> => {
  if (!party) return [];

  let docTemplates: DocumentRequirements;
  try {
    docTemplates = await getDocumentRequirements();
  } catch (error) {
    console.error("Failed to fetch document requirements for party checklist", error);
    return [];
  }

  // Get the appropriate template based on residency status
  const templateKey = party.residencyStatus === 'Singaporean/PR' 
    ? "Singaporean/PR" 
    : "Foreigner";
  
  const requiredDocs: TemplateDoc[] = docTemplates.individualTemplates[templateKey] || [];

  // Group uploaded documents by type
  const groupedDocs = groupDocumentsByType(uploadedDocuments);

  const checklistDocs = requiredDocs.map((templateDoc): PartyChecklistDocument => {
    // Find all versions of this document type
    const versions = groupedDocs.get(templateDoc.name) || [];
    
    if (versions.length > 0) {
      // Find the latest VERIFIED version
      const latestVerifiedVersion = versions.find(v => v.status === 'Verified');
      
      // Fallback to the latest version overall if no verified one exists
      const versionToDisplay = latestVerifiedVersion || versions[0];

      return {
        ...templateDoc,
        id: versionToDisplay.id.toString(),
        documentId: versionToDisplay.id,
        status: versionToDisplay.status,
        ownerId: party.partyId,
        ownerName: party.name,
        version: versionToDisplay.version,
        uploadedDate: versionToDisplay.uploadedDate,
        expiryDate: versionToDisplay.expiryDate || undefined,
        mimeType: versionToDisplay.mimeType,
        rejectionReason: versionToDisplay.rejectionReason || undefined,
        comments: versionToDisplay.comments || undefined,
        uploadedBy: versionToDisplay.uploadedBy,
        verifiedBy: versionToDisplay.verifiedBy,
        verifiedDate: versionToDisplay.verifiedDate || undefined,
        allVersions: versions, // All versions of this document type
      };
    }

    // No document uploaded yet
    return {
      ...templateDoc,
      id: `missing-${party.partyId}-${templateDoc.name}`,
      status: 'Missing',
      ownerId: party.partyId,
      ownerName: party.name,
    };
  });

  return [{
    category: `${party.name}'s Documents`,
    documents: checklistDocs,
  }];
};

// Helper function to calculate progress
export const calculatePartyDocumentProgress = (sections: PartyChecklistSection[]) => {
  const allDocs = sections.flatMap(s => s.documents);
  const requiredDocs = allDocs.filter(d => d.required);
  
  if (!requiredDocs.length) return { percentage: 100, missingDocs: [] };
  
  const completedDocs = requiredDocs.filter(d => d.status === 'Verified' || d.status === 'Submitted');
  const missingDocs = requiredDocs.filter(d => d.status === 'Missing' || d.status === 'Rejected');
  
  return {
    percentage: Math.round((completedDocs.length / requiredDocs.length) * 100),
    missingDocs,
  };
};