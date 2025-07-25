// =================================================================================
// FILE: src/features/case/utils/checklist.ts
// =================================================================================
import type {
  Case,
  Party,
  Document,
  CaseDocumentLink,
  DocumentVersion,
} from '@/types/entities';
import type { DocStatus } from '@/types/enums';
import { documentRequirementsTemplate } from '@/data/mockData';

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  CHECKLIST LIVE DOC                                                */
/* ------------------------------------------------------------------ */
export interface ChecklistDocument {
  /* ids & linkage */
  id?: string;                   // version-id when linked | synthetic when missing
  masterDocumentId?: string;     // the master record this version belongs to

  /* template info */
  name: string;
  required?: boolean;
  description?: string;          // 👈 NEW – human friendly note from template
  validityMonths?: number;       // 👈 NEW – policy rule (e.g. “must be ≤ 3 mths old”)

  /* status & metadata */
  status: DocStatus;
  ownerId: string;
  ownerName: string;
  version?: number;
  uploadedDate?: string;
  expiryDate?: string;
  mimeType?: string;
  rejectionReason?: string;

  /* reuse & history */
  reusableDocument?: { documentId: string; versionId: string } | null;
  allVersions?: DocumentVersion[];
}


export interface ChecklistSection {
  category: string;
  documents: ChecklistDocument[];
}

/* ------------------------------------------------------------------ */
/*  MAIN ENGINE                                                       */
/* ------------------------------------------------------------------ */
export const generateLiveChecklist = (
  onboardingCase: Case,
  parties: Party[],
  allDocuments: Document[],
  caseDocumentLinks: CaseDocumentLink[],
  isException = false,
): {
  checklist: ChecklistSection[];
  progress: { percentage: number; missingDocs: ChecklistDocument[] };
} => {
  if (!onboardingCase)
    return { checklist: [], progress: { percentage: 0, missingDocs: [] } };

  const { entity, relatedPartyLinks, riskLevel } = onboardingCase;
  const checklist: ChecklistSection[] = [];

  /* ------------ helper: map template-item → live status ------------ */
  const findContext = (
    templateDoc: {
      name: string;
      required?: boolean;
      description?: string;
      validityMonths?: number;
    },
    ownerId: string,
    ownerName: string,
  ): ChecklistDocument => {
    const { name } = templateDoc;

    /* ① already linked to this case? */
    const linkedMaster = allDocuments.find((d) => {
      const link = caseDocumentLinks.find((l) => l.documentId === d.documentId);
      return d.ownerId === ownerId && d.name === name && !!link;
    });

    if (linkedMaster) {
      const link = caseDocumentLinks.find(
        (l) => l.documentId === linkedMaster.documentId,
      )!;
      const version =
        linkedMaster.versions.find((v) => v.id === link.versionId) ??
        linkedMaster.versions[linkedMaster.versions.length - 1];

      return {
        ...templateDoc,
        ...version,
        id: version.id,
        status: link.status,
        ownerId,
        ownerName,
        masterDocumentId: linkedMaster.documentId,
        allVersions: linkedMaster.versions,
      };
    }

    /* ② reusable verified copy? */
    const reusable = allDocuments.find(
      (d) =>
        d.ownerId === ownerId &&
        d.name === name &&
        d.versions.some((v) => v.status === 'Verified'),
    );

    if (reusable) {
      const latest = [...reusable.versions]
        .filter((v) => v.status === 'Verified')
        .sort((a, b) => b.version - a.version)[0];

      return {
        ...templateDoc,
        id: latest.id,
        status: 'Missing',
        ownerId,
        ownerName,
        reusableDocument: { documentId: reusable.documentId, versionId: latest.id },
        masterDocumentId: reusable.documentId,
        allVersions: reusable.versions,
      };
    }

    /* ③ nothing yet */
    return {
      ...templateDoc,
      id: `${ownerId}-${name}`,
      status: 'Missing',
      ownerId,
      ownerName,
    };
  };

  /* ================================================================= */
  /* 1. ENTITY-LEVEL DOCS + FORMS                                      */
  /* ================================================================= */
  const entityTemplate =
    documentRequirementsTemplate.entityTemplates[entity.entityType] ?? [];

  const entityDocs = [
    ...entityTemplate,
    ...documentRequirementsTemplate.bankFormTemplates.corporateMandatory.map(
      (n) => ({ name: n, required: true }),
    ),
    ...(isException
      ? documentRequirementsTemplate.bankFormTemplates.corporateOptional.map((n) => ({
          name: n,
          required: true,
        }))
      : []),
  ];

  if (riskLevel === 'High') {
    entityDocs.push(...documentRequirementsTemplate.riskBasedDocuments.High);
  }

  checklist.push({
    category: 'Entity Documents & Forms',
    documents: entityDocs.map((t) =>
      findContext(t, entity.customerId, entity.entityName),
    ),
  });

  /* ================================================================= */
  /* 2. INDIVIDUAL STAKEHOLDERS                                        */
  /* ================================================================= */
  (relatedPartyLinks ?? []).forEach((link) => {
    const party = parties.find((p) => p.partyId === link.partyId);
    if (!party) return;

    const stakeholderEntities = [
      'Individual Account',
      'Joint Account',
      'Joint Account (Non-resident)',
    ];
    const needsStakeholderForms = stakeholderEntities.includes(entity.entityType);

    const indDocs = [
      ...(documentRequirementsTemplate.individualTemplates[party.residencyStatus] ?? []),
      ...(needsStakeholderForms
        ? documentRequirementsTemplate.bankFormTemplates.individualStakeholder.map((n) => ({
            name: n,
            required: true,
          }))
        : []),
    ];

    checklist.push({
      category: `Documents for ${party.name}`,
      documents: indDocs.map((t) => findContext(t, party.partyId, party.name)),
    });
  });

  /* ================================================================= */
  /* 3. PROGRESS %                                                     */
  /* ================================================================= */
  const progress = calculateDocumentProgress(checklist);
  return { checklist, progress };
};

/* ------------------------------------------------------------------ */
export const calculateDocumentProgress = (sections: ChecklistSection[]) => {
  const mustHave = sections.flatMap((s) => s.documents.filter((d) => d.required));
  if (!mustHave.length) return { percentage: 100, missingDocs: [] };

  const done = mustHave.filter((d) => d.status === 'Verified' || d.status === 'Submitted');
  const missing = mustHave.filter((d) => d.status === 'Missing' || d.status === 'Rejected');

  return {
    percentage: Math.round((done.length / mustHave.length) * 100),
    missingDocs: missing,
  };
};
