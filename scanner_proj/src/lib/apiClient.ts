// =================================================================================
// FILE: src/lib/apiClient.ts
// =================================================================================
import type { EnumConfig, CaseStatus, RiskLevel, DocStatus } from '@/types/enums';
import type { 
  User, 
  Party, 
  Case, 
  CaseCreationData, 
  ActivityLog, 
  CallReport, 
  DocumentRequirements,
  Document,
  ScannerProfile,
  CaseDocumentLink,
  DocumentVersion,
} from '@/types/entities';


// Add this at the top with other interfaces
interface BackendUser {
  userId: string;
  username: string;
  password: string;
  enabled: boolean;
  name: string;
  email: string;
  role: string;
  department?: string;
  roles?: string[];
}

// Define types for API responses
interface DocumentDto {
  id: number;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  sizeInBytes: number;
  expiryDate?: string;
  createdBy?: string;
  createdDate?: string;
  name: string;
  status: string;
  version: number;
  ownerType: string;
  ownerId: string;
  uploadedBy?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  comments?: string;
  isCurrentForCase?: boolean; 
}

interface RelatedPartyDto {
  id: number;
  partyId: string;
  name: string;
  relationshipType: string;
  ownershipPercentage?: number;
}

interface ScanTriggerResponse {
  documentId: string;
  status: string;
  message?: string;
}

// Define the base URL for your backend API from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

// --- Authentication Helper ---
const getAuthHeaders = () => {
  // Get credentials from environment variables
  const username = process.env.NEXT_PUBLIC_API_USERNAME || 'admin';
  const password = process.env.NEXT_PUBLIC_API_PASSWORD || 'password123';
  
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`API Error: ${response.status} - ${errorText}`);
    throw new Error(`API call failed with status: ${response.status}`);
  }
  return response.json();
};

// --- Case-related Functions ---

export const getCases = async (): Promise<Case[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases`, { 
      headers: getAuthHeaders(),
      credentials: 'include' // Important for CORS
    });
    return await handleApiResponse<Case[]>(response);
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    throw error;
  }
};

// Updated getCaseDetails function in apiClient.ts
export const getCaseDetails = async (caseId: string) => {
  try {
    const headers = getAuthHeaders();
    const [caseResponse, partiesResponse, documentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/cases/${caseId}`, { headers, credentials: 'include' }),
      fetch(`${API_BASE_URL}/parties/case/${caseId}`, { headers, credentials: 'include' }),
      fetch(`${API_BASE_URL}/documents/case/${caseId}`, { headers, credentials: 'include' }),
    ]);

    if (!caseResponse.ok) {
      return null;
    }

    const caseData = await handleApiResponse<Case>(caseResponse);
    const parties = partiesResponse.ok ? await handleApiResponse<Party[]>(partiesResponse) : [];
    const documentsDto = documentsResponse.ok ? await handleApiResponse<DocumentDto[]>(documentsResponse) : [];
    
    console.log('Server Documents fetched from API:', documentsDto);
    
    // Transform the flat document DTOs into the expected structure
    const documentsMap = new Map<string, Document>();
    const documentLinks: CaseDocumentLink[] = [];
    
    documentsDto.forEach(dto => {
      // ✅ FIX: Sanitize the document type to create a URL-safe document ID
      const sanitizedDocType = dto.documentType
        .replace(/\//g, '_')     // Replace forward slashes with underscores
        .replace(/\s+/g, '-')    // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9_-]/g, ''); // Remove any other special characters
      
      const documentId = `DOC-${dto.ownerId}-${sanitizedDocType}`;
      
      // Get or create the document
      let document = documentsMap.get(documentId);
      if (!document) {
        document = {
          documentId,
          ownerId: dto.ownerId,
          name: dto.documentType, // Use documentType as the name
          versions: []
        };
        documentsMap.set(documentId, document);
      }
      
      // Add this version to the document
      const version: DocumentVersion = {
        id: dto.id.toString(),
        version: dto.version,
        status: dto.status as DocStatus,
        uploadedDate: dto.createdDate || new Date().toISOString(),
        fileRef: `/api/documents/download/${dto.id}`,
        mimeType: dto.mimeType,
        fileSize: dto.sizeInBytes,
        expiryDate: dto.expiryDate,
        uploadedBy: dto.uploadedBy,
        verifiedBy: dto.verifiedBy,
        verifiedDate: dto.verifiedDate,
        rejectionReason: dto.rejectionReason,
        comments: dto.comments,
        isCurrentForCase: dto.isCurrentForCase || false // Trust the backend value
      };
      
      // Log if this version is marked as current
      if (dto.isCurrentForCase) {
        console.log('📌 Backend marked version as current:', {
          documentType: dto.documentType,
          versionId: dto.id,
          version: dto.version,
          isCurrentForCase: dto.isCurrentForCase
        });
      }
      
      document.versions.push(version);
      
      // Only create a link if this document is actually linked to the case
      // Check if isCurrentForCase is true - if so, this version is linked
      if (dto.isCurrentForCase || dto.status !== 'Missing') {
        const link: CaseDocumentLink = {
          linkId: dto.ownerType === 'CASE' 
            ? `LNK-${caseId}-${dto.id}`
            : `LNK-${caseId}-PARTY-${dto.id}`,
          caseId: caseId,
          documentId: documentId,
          versionId: version.id,
          status: dto.status as DocStatus,
          comments: dto.comments
        };
        documentLinks.push(link);
      }
    });
    
    // Sort versions within each document by version number
    documentsMap.forEach(doc => {
      doc.versions.sort((a, b) => a.version - b.version);
    });
    
    // ✅ IMPORTANT: Only process isCurrentForCase if backend isn't sending it
    const hasAnyCurrentFlags = documentsDto.some(dto => dto.isCurrentForCase === true);
    
    if (!hasAnyCurrentFlags) {
      console.log('⚠️ No isCurrentForCase flags from backend, determining from document links');
      
      // Group links by document and keep only the most recent one
      const currentLinksByDocument = new Map<string, CaseDocumentLink>();
      
      documentLinks.forEach(link => {
        const existing = currentLinksByDocument.get(link.documentId);
        if (!existing || parseInt(link.versionId) > parseInt(existing.versionId)) {
          currentLinksByDocument.set(link.documentId, link);
        }
      });
      
      // Set isCurrentForCase based on the current links
      documentsMap.forEach((doc, docId) => {
        const currentLink = currentLinksByDocument.get(docId);
        
        doc.versions = doc.versions.map(v => ({
          ...v,
          isCurrentForCase: currentLink ? v.id === currentLink.versionId : false
        }));
        
        if (currentLink) {
          console.log('🔍 Set current version from links:', {
            documentId: docId,
            documentName: doc.name,
            currentVersionId: currentLink.versionId,
            versions: doc.versions.map(v => ({
              id: v.id,
              version: v.version,
              isCurrentForCase: v.isCurrentForCase
            }))
          });
        }
      });
    } else {
      console.log('✅ Using isCurrentForCase flags from backend');
      
      // Log current versions for debugging
      documentsMap.forEach((doc) => {
        const currentVersions = doc.versions.filter(v => v.isCurrentForCase);
        if (currentVersions.length > 0) {
          console.log('📌 Document current version(s):', {
            documentName: doc.name,
            currentVersions: currentVersions.map(v => ({
              id: v.id,
              version: v.version,
              status: v.status
            }))
          });
        }
      });
    }
    
    const documents = Array.from(documentsMap.values());
    
    console.log('Server Processed documents:', documents);
    console.log('Server Document links:', documentLinks);
    console.log('Document links breakdown:', {
      total: documentLinks.length,
      caseDocuments: documentLinks.filter(l => l.linkId.includes('LNK-' + caseId + '-') && !l.linkId.includes('PARTY')).length,
      partyDocuments: documentLinks.filter(l => l.linkId.includes('PARTY')).length
    });
    
    const scannerProfiles = await getScannerProfiles();
    const allUsers = await getUsers();
    const allParties = await getParties();
    
    return { 
      caseData, 
      parties, 
      documents, 
      documentLinks,
      scannerProfiles, 
      allUsers,
      allParties 
    };
  } catch (error) {
    console.error(`Failed to fetch case details for ${caseId}:`, error);
    throw error;
  }
};

export const createCase = async (newCaseData: CaseCreationData): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(newCaseData),
    });

    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to create case:", error);
    throw error;
  }
};

// --- User-related Functions ---

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, { 
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const users = await handleApiResponse<BackendUser[]>(response);
    
    // Map backend user structure to frontend
    return users.map(user => ({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.roles?.[0] || user.role, // Get first role or fallback
      department: user.department || '',
      isActive: user.enabled !== undefined ? user.enabled : true
    }));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

// --- Template & Enum Functions ---

export const getEnums = async (): Promise<EnumConfig> => {
  try {
    // Enums endpoint is public, so no auth header is needed based on your SecurityConfig
    const response = await fetch(`${API_BASE_URL}/enums`);
    return await handleApiResponse<EnumConfig>(response);
  } catch (error) {
    console.error("Failed to fetch enums:", error);
    // Fallback to default enums
    return {
      roles: {
        'ROLE_MANAGER': {
          label: 'General Manager',
          permissions: { 
            'case:read': true, 
            'case:update': true, 
            'case:approve': true, 
            'admin:manage-users': true, 
            'document:upload': true,
            'document:verify': true,
            'document:read': true
          },
        },
        'ROLE_PROCESSOR': {
          label: 'Deposits Manager',
          permissions: { 
            'case:read': true, 
            'case:update': true,
            'document:upload': true,
            'document:verify': true,
            'document:read': true
          },
        },
        'ROLE_VIEWER': {
          label: 'Read-Only User',
          permissions: { 
            'case:read': true, 
            'case:update': false, 
            'case:approve': false, 
            'admin:manage-users': false, 
            'document:upload': false,
            'document:read': true
          },
        },
        'ROLE_COMPLIANCE': {
          label: 'Compliance Officer',
          permissions: { 
            'case:read': true, 
            'case:update': true,
            'case:approve': true,
            'document:upload': true,
            'document:verify': true,
            'document:read': true
          },
        },
        'ROLE_ADMIN': {
          label: 'System Administrator',
          permissions: { 
            'case:read': true, 
            'case:update': true, 
            'case:approve': true, 
            'admin:manage-users': true, 
            'admin:manage-templates': true,
            'document:upload': true,
            'document:verify': true,
            'document:read': true
          },
        },
      },
      enums: {
        caseStatus: ['Prospect', 'KYC Review', 'Pending Approval', 'Active', 'Rejected'],
        riskLevel: ['Low', 'Medium', 'High'],
        docStatus: ['Missing', 'Submitted', 'Verified', 'Rejected', 'Expired'],
        entityTypes: ['Non-Listed Company', 'Listed Company', 'Partnership', 'Trust Account'],
      }
    };
  }
};

// Cache for document requirements to avoid repeated API calls
let cachedDocumentRequirements: DocumentRequirements | null = null;

export const getDocumentRequirements = async (): Promise<DocumentRequirements> => {
  // Return cached version if available
  if (cachedDocumentRequirements) {
    return cachedDocumentRequirements;
  }

  try {
    // This endpoint is public based on your SecurityConfig
    const response = await fetch(`${API_BASE_URL}/configurations/document-requirements`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document requirements: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched document requirements:', data);
    
    // Cache the requirements
    cachedDocumentRequirements = data;
    return data;
  } catch (error) {
    console.error('Error fetching document requirements:', error);
    
    // Fallback to empty template if the API fails
    return {
      individualTemplates: {},
      entityTemplates: {},
      bankFormTemplates: {
        corporateMandatory: [],
        corporateOptional: [],
        individualStakeholder: []
      },
      riskBasedDocuments: {},
      entityRoleMapping: {}
    };
  }
};

// Function to clear the cache if needed (e.g., after admin updates templates)
export function clearDocumentRequirementsCache() {
  cachedDocumentRequirements = null;
}

// --- Case Management Functions ---

export const assignCase = async (caseId: string, userId: string): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to assign case:", error);
    throw error;
  }
};


export const updateEntityData = async (caseId: string, entityData: Case['entity']): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/entity`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(entityData),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to update entity data:", error);
    throw error;
  }
};

// --- Activity & Reports Functions ---

export const addActivityLog = async (caseId: string, activityData: Omit<ActivityLog, 'activityId' | 'timestamp'>): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        type: activityData.type,
        details: activityData.details
      }),
    });
    
    // The backend returns the ActivityLog, but we need to return the updated Case
    // So we'll fetch the updated case data
    await handleApiResponse<ActivityLog>(response);
    const details = await getCaseDetails(caseId);
    if (!details?.caseData) throw new Error('Case not found');
    return details.caseData;
  } catch (error) {
    console.error("Failed to add activity log:", error);
    throw error;
  }
};

export const addCallReport = async (caseId: string, reportData: Omit<CallReport, 'reportId'>): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    
    // Similar to activity log, fetch updated case
    await handleApiResponse<CallReport>(response);
    const details = await getCaseDetails(caseId);
    if (!details?.caseData) throw new Error('Case not found');
    return details.caseData;
  } catch (error) {
    console.error("Failed to add call report:", error);
    throw error;
  }
};

// --- Party Management Functions ---

export const getParties = async (): Promise<Party[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return await handleApiResponse<Party[]>(response);
  } catch (error) {
    console.error("Failed to fetch parties:", error);
    throw error;
  }
};

export const getPartyDetails = async (partyId: string) => {
  try {
    const headers = getAuthHeaders();
    const [partyResponse, documentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/parties/${partyId}`, { headers, credentials: 'include' }),
      fetch(`${API_BASE_URL}/parties/${partyId}/documents`, { headers, credentials: 'include' }),
    ]);

    if (!partyResponse.ok) {
      return null;
    }

    const party = await handleApiResponse<Party>(partyResponse);
    const documents = documentsResponse.ok ? await handleApiResponse<Document[]>(documentsResponse) : [];
    
    return { party, documents };
  } catch (error) {
    console.error(`Failed to fetch party details for ${partyId}:`, error);
    throw error;
  }
};

export const createParty = async (partyData: Omit<Party, 'partyId'>): Promise<Party> => {
  try {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(partyData),
    });
    return await handleApiResponse<Party>(response);
  } catch (error) {
    console.error("Failed to create party:", error);
    throw error;
  }
};

export const updateParty = async (partyId: string, partyData: Partial<Party>): Promise<Party> => {
  try {
    const response = await fetch(`${API_BASE_URL}/parties/${partyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(partyData),
    });
    return await handleApiResponse<Party>(response);
  } catch (error) {
    console.error("Failed to update party:", error);
    throw error;
  }
};

// In your src/lib/apiClient.ts file, find and update the addRelatedParty function:

export const addRelatedParty = async (
  caseId: string, 
  partyData: { 
    partyId: string; 
    name: string; // This field was missing and causing the error
    relationshipType: string; 
    ownershipPercentage?: number 
  }
): Promise<RelatedPartyDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(partyData),
    });
    return await handleApiResponse<RelatedPartyDto>(response);
  } catch (error) {
    console.error("Failed to add related party:", error);
    throw error;
  }
};

export const removeRelatedParty = async (
  caseId: string, 
  partyId: string,
  relationshipType: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cases/${caseId}/parties/${partyId}?relationshipType=${encodeURIComponent(relationshipType)}`, 
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to remove party: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to remove related party:", error);
    throw error;
  }
};


// --- User Management Functions ---

export const createUser = async (userData: Omit<User, 'userId' | 'isActive'>): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        username: userData.email.split('@')[0], // Generate username from email
        password: 'password123', // Default password
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        enabled: true,
        roles: [userData.role] // Backend expects role array
      }),
    });
    
    const createdUser = await handleApiResponse<BackendUser>(response);
    
    // Map backend response to frontend User type
    return {
      userId: createdUser.userId,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.roles?.[0] || createdUser.role,
      department: createdUser.department || '',
      isActive: createdUser.enabled !== undefined ? createdUser.enabled : true
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, isEnabled: boolean): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isEnabled }),
    });
    const updatedUser = await handleApiResponse<BackendUser>(response);
    
    // Map backend 'enabled' to frontend 'isActive'
    return {
      userId: updatedUser.userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.roles?.[0] || updatedUser.role,
      department: updatedUser.department || '',
      isActive: updatedUser.enabled !== undefined ? updatedUser.enabled : true
    };
  } catch (error) {
    console.error("Failed to update user status:", error);
    throw error;
  }
};

// --- Document Management Functions ---

export const uploadDocument = async (
  ownerId: string, 
  ownerType: 'CASE' | 'PARTY', 
  documentType: string, 
  file: File,
  metadata?: { expiryDate?: string; comments?: string }
): Promise<DocumentDto> => {
  try {
    console.log('Upload parameters:', {
      ownerId,
      ownerType,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      metadata
    });

    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    
    // ✅ Add metadata fields if provided
    if (metadata?.expiryDate) {
      formData.append('expiryDate', metadata.expiryDate);
    }
    if (metadata?.comments) {
      formData.append('comments', metadata.comments);
    }

    const endpoint = ownerType === 'CASE' 
      ? `${API_BASE_URL}/documents/upload/case/${ownerId}`
      : `${API_BASE_URL}/documents/upload/party/${ownerId}`;

    console.log('Uploading to endpoint:', endpoint);
    console.log('FormData entries:', Array.from(formData.entries()));

    // Note: Don't set Content-Type header for FormData - browser will set it with boundary
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeaders().Authorization,
      },
      credentials: 'include',
      body: formData,
    });

    const result = await handleApiResponse<DocumentDto>(response);
    console.log('Upload response:', result);
    return result;
  } catch (error) {
    console.error("Failed to upload document:", error);
    throw error;
  }
};
export const updateDocumentStatus = async (documentId: number, status: string, rejectionReason?: string): Promise<DocumentDto> => {
  try {
    const params = new URLSearchParams({ status });
    if (rejectionReason) {
      params.append('rejectionReason', rejectionReason);
    }

    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/status?${params}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    return await handleApiResponse<DocumentDto>(response);
  } catch (error) {
    console.error("Failed to update document status:", error);
    throw error;
  }
};

export const downloadDocument = async (documentId: number): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/download/${documentId}`, {
      headers: {
        'Authorization': getAuthHeaders().Authorization,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Failed to download document:", error);
    throw error;
  }
};

// --- Scanner Integration ---

export const triggerScan = async (scanRequest: {
  profileName: string;
  ownerType: string;
  ownerId: string;
  documentType: string;
  format?: string;
}): Promise<ScanTriggerResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scans/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(scanRequest),
    });

    return await handleApiResponse<ScanTriggerResponse>(response);
  } catch (error) {
    console.error("Failed to trigger scan:", error);
    throw error;
  }
};

// --- Scanner Profiles ---

export const getScannerProfiles = async (): Promise<ScannerProfile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scanner-profiles`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return await handleApiResponse<ScannerProfile[]>(response);
  } catch (error) {
    console.error("Failed to fetch scanner profiles:", error);
    throw error;
  }
};

// --- Document Requirements Management ---

export const updateDocumentRequirements = async (requirements: DocumentRequirements): Promise<DocumentRequirements | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configurations/document-requirements`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(requirements),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update document requirements: ${response.status}`);
    }
    
    const updated = await response.json();
    
    // Clear the cache so next fetch gets fresh data
    clearDocumentRequirementsCache();
    
    return updated;
  } catch (error) {
    console.error('Error updating document requirements:', error);
    throw error;
  }
};

// =================================================================================
// FILE: src/lib/apiClient.ts (Updated section for workflow stage mapping)
// =================================================================================

// Add this helper function near the top of your apiClient.ts file
const getWorkflowStageFromStatus = (status: CaseStatus): string => {
  const statusToStageMap: Record<CaseStatus, string> = {
    'Prospect': 'prospect',
    'KYC Review': 'kyc_review',
    'Pending Approval': 'approval',
    'Active': 'completed',
    'Rejected': 'completed'
  };
  
  return statusToStageMap[status] || 'prospect';
};

// Replace your existing updateCaseStatus function with this:
export const updateCaseStatus = async (caseId: string, updates: { status: CaseStatus, riskLevel: RiskLevel }): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    
    const updatedCase = await handleApiResponse<Case>(response);
    
    // Since the backend doesn't update workflowStage yet, we do it client-side
    // This is temporary until the backend is updated
    updatedCase.workflowStage = getWorkflowStageFromStatus(updates.status);
    
    return updatedCase;
  } catch (error) {
    console.error("Failed to update case status:", error);
    throw error;
  }
};

// ✅ FIX: Updated to encode the documentId to handle special characters
export const updateDocumentLink = async (
  caseId: string, 
  documentId: string, 
  versionId: string
): Promise<CaseDocumentLink> => {
  try {
    // URL encode the documentId to handle special characters like forward slashes
    const encodedDocumentId = encodeURIComponent(documentId);
    const url = `${API_BASE_URL}/cases/${caseId}/documents/${encodedDocumentId}/link`;
    
    console.log('🔗 updateDocumentLink details:', {
      originalDocumentId: documentId,
      encodedDocumentId,
      fullUrl: url,
      caseId,
      versionId,
      body: JSON.stringify({ versionId })
    });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ versionId }),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Response error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }
    
    const result = await handleApiResponse<CaseDocumentLink>(response);
    console.log('✅ updateDocumentLink successful:', result);
    return result;
  } catch (error) {
    console.error("❌ Failed to update document link:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Add this function to your apiClient.ts file

// ✅ NEW: Make a document version current for a case
export const makeDocumentCurrentForCase = async (
  caseId: string,
  documentType: string, 
  documentId: string
): Promise<DocumentDto> => {
  try {
    console.log('🔄 API CLIENT: Making document current:', {
      caseId,
      documentType,
      documentId
    });

    const response = await fetch(
      `${API_BASE_URL}/documents/case/${caseId}/document/${encodeURIComponent(documentType)}/make-current/${documentId}`, 
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );

    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`Make current failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Make current API success:', result);
    return result;
  } catch (error) {
    console.error("❌ Failed to make document current:", error);
    throw error;
  }
};

// ✅ ALTERNATIVE: Simple make current function
export const makeDocumentCurrent = async (
  documentId: string,
  caseId: string,
  documentType?: string
): Promise<DocumentDto> => {
  try {
    console.log('🔄 API CLIENT: Simple make current:', {
      documentId,
      caseId,
      documentType
    });

    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}/make-current`, 
      {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ 
          caseId,
          documentType 
        })
      }
    );

    console.log('📡 Simple API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ Simple API Error:', response.status, errorText);
      throw new Error(`Simple make current failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Simple make current API success:', result);
    return result;
  } catch (error) {
    console.error("❌ Failed to make document current (simple):", error);
    throw error;
  }
};