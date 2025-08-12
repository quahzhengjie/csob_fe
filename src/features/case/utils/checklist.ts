// =================================================================================
// FILE: src/features/case/utils/checklist.ts
// =================================================================================
import type {
  Case,
  Party,
  Document,
  DocumentRequirements,
  DocStatus,
  UserInfo,
} from '@/types/entities';

import { getDocumentRequirements } from '@/lib/apiClient';

/* ------------------------------------------------------------------ */
/* TYPES                                                             */
/* ------------------------------------------------------------------ */


// Add this property to your ChecklistDocument interface:
export interface ChecklistDocument {
  id?: string;
  documentId?: number;

  // Template Info
  name: string;
  required?: boolean;
  description?: string;
  validityMonths?: number;
  category?: 'CUSTOMER' | 'BANK_MANDATORY' | 'BANK_NON_MANDATORY';

  // Status & Metadata
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
  
  // Add this property that's missing:
  reusableDocument?: { documentId: string; versionId: string } | null;
  
  allVersions?: Document[];
  isAdHoc?: boolean;
}

export interface ChecklistSection {
  category: string;
  documents: ChecklistDocument[];
}

// Type for the grouped document map
type GroupedDocuments = Map<string, Document[]>;


/* ------------------------------------------------------------------ */
/* HELPER FUNCTION - The core of the fix                             */
/* ------------------------------------------------------------------ */

/**
 * Pre-processes the flat list of documents into a map grouped by owner and type.
 * This makes looking up version history efficient.
 * @param allDocuments - The flat list of document versions from the API.
 * @returns A map where the key is `${ownerId}-${documentType}`.
 */
const groupDocuments = (allDocuments: Document[]): GroupedDocuments => {
  const documentMap: GroupedDocuments = new Map();
  // Guard against null or undefined input
  if (!allDocuments) return documentMap;

  for (const doc of allDocuments) {
    // Create a unique key for each document type belonging to an owner
    const key = `${doc.ownerId}-${doc.documentType}`;
    if (!documentMap.has(key)) {
      documentMap.set(key, []);
    }
    // Push the current version into the group
    documentMap.get(key)!.push(doc);
  }

  // After grouping, sort the versions within each group (latest first)
  documentMap.forEach(versions => versions.sort((a, b) => b.version - a.version));
  
  return documentMap;
};

/* ------------------------------------------------------------------ */
/* MAIN ENGINE                                                       */
/* ------------------------------------------------------------------ */
export const generateLiveChecklist = async (
  onboardingCase: Case,
  parties: Party[],
  allDocuments: Document[], // Expects the new, flat array of Documents
  isException = false,
): Promise<{
  checklist: ChecklistSection[];
  progress: { percentage: number; missingDocs: ChecklistDocument[] };
}> => {
  if (!onboardingCase) {
    return { checklist: [], progress: { percentage:0, missingDocs: [] } };
  }

  const { entity, relatedPartyLinks, riskLevel } = onboardingCase;
  
  if (!entity) {
    console.error('Case has no entity data!');
    return { checklist: [], progress: { percentage: 0, missingDocs: [] } };
  }

  let documentRequirementsTemplate: DocumentRequirements;
  try {
    documentRequirementsTemplate = await getDocumentRequirements();
  } catch (error) {
    console.error('Failed to fetch document requirements:', error);
    return { checklist: [], progress: { percentage: 0, missingDocs: [] } };
  }
  
  // --- FIX: Pre-group documents for efficient lookup ---
  const groupedDocs = groupDocuments(allDocuments);
  const checklist: ChecklistSection[] = [];

  const findContext = (
    templateDoc: { 
      name: string; 
      required?: boolean; 
      description?: string; 
      validityMonths?: number;
      category?: 'CUSTOMER' | 'BANK_MANDATORY' | 'BANK_NON_MANDATORY';
    },
    ownerId: string,
    ownerName: string,
    isEntityDoc: boolean,
  ): ChecklistDocument => {
    const effectiveOwnerId = isEntityDoc ? onboardingCase.caseId : ownerId;
    const key = `${effectiveOwnerId}-${templateDoc.name}`;
    const versions = groupedDocs.get(key); // This gets the array of all versions

    if (versions && versions.length > 0) {
      // The versions are pre-sorted, so the current one is either marked or is the first one
      const currentVersion = versions.find(v => v.isCurrentForCase) || versions[0];
      
      return {
        ...templateDoc,
        id: currentVersion.id.toString(),
        documentId: currentVersion.id,
        status: currentVersion.status,
        ownerId: isEntityDoc ? entity.customerId : ownerId,
        ownerName,
        version: currentVersion.version,
        uploadedDate: currentVersion.uploadedDate,
        expiryDate: currentVersion.expiryDate || undefined,
        mimeType: currentVersion.mimeType,
        rejectionReason: currentVersion.rejectionReason || undefined,
        comments: currentVersion.comments || undefined,
        uploadedBy: currentVersion.uploadedBy,
        verifiedBy: currentVersion.verifiedBy,
        verifiedDate: currentVersion.verifiedDate || undefined,
        isAdHoc: currentVersion.isAdHoc,
        // --- FIX: Attach the full version history here ---
        allVersions: versions,
      };
    }

    // No document found, return as 'Missing'
    return {
      ...templateDoc,
      id: `missing-${ownerId}-${templateDoc.name}`,
      status: 'Missing',
      ownerId: isEntityDoc ? entity.customerId : ownerId,
      ownerName,
    };
  };

  /* ================================================================= */
  /* BUILD CHECKLIST SECTIONS                                          */
  /* ================================================================= */
  
  // Get entity-specific templates
  const entityTemplate = documentRequirementsTemplate.entityTemplates[entity.entityType] ?? [];
  
  // DEBUG: Log what we're getting
  console.log('🔍 Checklist Generation Debug:', {
    entityType: entity.entityType,
    availableEntityTypes: Object.keys(documentRequirementsTemplate.entityTemplates),
    entityTemplateFound: documentRequirementsTemplate.entityTemplates[entity.entityType],
    entityTemplateLength: entityTemplate.length,
    allTemplates: documentRequirementsTemplate.entityTemplates,
    firstFewDocs: entityTemplate.slice(0, 3)
  });
  
  // Start with all entity documents (they now include category information)
  const entityDocs = [...entityTemplate];

  // If it's an exception case, mark BANK_NON_MANDATORY documents as required
  if (isException) {
    entityDocs.forEach(doc => {
      if (doc.category === 'BANK_NON_MANDATORY') {
        doc.required = true;
      }
    });
  }

  // Add risk-based documents for high-risk cases
  if (riskLevel === 'High' && documentRequirementsTemplate.riskBasedDocuments?.['High']) {
    entityDocs.push(...documentRequirementsTemplate.riskBasedDocuments['High']);
  }

  checklist.push({
    category: 'Entity Documents & Forms',
    documents: entityDocs.map(t => findContext(t, onboardingCase.caseId, entity.entityName, true)),
  });

  /* ================================================================= */
  /* INDIVIDUAL STAKEHOLDERS                                           */
  /* ================================================================= */
  (relatedPartyLinks ?? []).forEach(link => {
    const party = parties.find(p => p.partyId === link.partyId);
    if (!party) return;

    // Get individual templates based on residency status
    const individualTemplateKey = party.residencyStatus === 'Singaporean/PR' 
        ? "Singaporean/PR" 
        : "Foreigner";
    const indDocs = [...(documentRequirementsTemplate.individualTemplates[individualTemplateKey] ?? [])];

    // Note: Individual stakeholder forms are now part of the entity templates with proper category
    // No need for separate handling here

    checklist.push({
      category: `Documents for ${party.name}`,
      documents: indDocs.map(t => findContext(t, party.partyId, party.name, false)),
    });
  });

  const progress = calculateDocumentProgress(checklist);
  return { checklist, progress };
};


export const calculateDocumentProgress = (sections: ChecklistSection[]) => {
  const mustHave = sections.flatMap(s => s.documents.filter(d => d.required));
  if (!mustHave.length) return { percentage: 100, missingDocs: [] };
  const done = mustHave.filter(d => d.status === 'Verified' || d.status === 'Submitted');
  const missing = mustHave.filter(d => d.status === 'Missing' || d.status === 'Rejected');
  return {
    percentage: Math.round((done.length / mustHave.length) * 100),
    missingDocs: missing,
  };
};