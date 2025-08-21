import type {
  EnumConfig,
  CaseStatus,
  RiskLevel,
  DocStatus,
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
  Role,
  TemplateDoc,
  UserInfo
} from '@/types/entities';
import type { NewUserData } from '@/features/admin/components/AddUserModal';

interface BackendUser {
  userId: string;
  username: string;
  enabled: boolean;
  name: string;
  email: string;
  role: string;
  roleId: number;
  department?: string;
  roles?: string[];
}

interface DocumentDto {
  id: number;
  name: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  sizeInBytes: number;
  status: string;
  version: number;
  ownerType: string;
  ownerId: string;
  
  // User attribution - can be either object or string depending on backend version
  uploadedBy?: UserInfo | string | null;
  uploadedDate?: string;
  verifiedBy?: UserInfo | string | null;
  verifiedDate?: string | null;
  
  rejectionReason?: string | null;
  expiryDate?: string | null;
  comments?: string | null;
  isCurrentForCase?: boolean;
  isAdHoc?: boolean;
  
  // Legacy fields that might still be present
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
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

// Export for use in other components
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';
let cachedDocumentRequirements: DocumentRequirements | null = null;

// Isomorphic function to get auth headers on client or server
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let token: string | undefined;

  if (typeof window !== 'undefined') {
    // Client-side: get token from localStorage
    token = localStorage.getItem('authToken') || undefined;
  } else {
    // Server-side: dynamically import and use cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    token = cookieStore.get('authToken')?.value;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Isomorphic function to get auth headers for file uploads
const getAuthHeadersForUpload = async (): Promise<HeadersInit> => {
    const headers: Record<string, string> = {};
    let token: string | undefined;

    if (typeof window !== 'undefined') {
        // Client-side: get token from localStorage
        token = localStorage.getItem('authToken') || undefined;
    } else {
        // Server-side: dynamically import and use cookies
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        token = cookieStore.get('authToken')?.value;
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};


// In apiClient.ts - Update handleApiResponse
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401 && typeof window !== 'undefined') {
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authTimestamp');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
      
      throw new Error('Authentication required');
    }
    
    const errorText = await response.text().catch(() => `Failed to read error response from API.`);
    console.error(`API Error: ${response.status} - ${errorText}`);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {} as T;
  } catch (e) {
    console.error('Failed to parse response:', e);
    return {} as T;
  }
};

const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
  console.log('Mapping backend user:', backendUser); // Debug log to check what's coming from backend
  
  return {
      userId: backendUser.userId,
      username: backendUser.username || '', // Add username mapping with fallback
      name: backendUser.name,
      email: backendUser.email,
      role: backendUser.role,
      roleId: backendUser.roleId || 0,
      department: backendUser.department || '',
      isActive: backendUser.enabled !== undefined ? backendUser.enabled : true,
  };
};

// ✅ USER FETCHING
export const getUsers = async (): Promise<User[]> => {
 try {
   const response = await fetch(`${API_BASE_URL}/users`, {
     headers: await getAuthHeaders(),
     credentials: 'include'
   });
   const users = await handleApiResponse<BackendUser[]>(response);
   return users.map(mapBackendUserToFrontend);
 } catch (error) {
   console.error("Failed to fetch users:", error);
   throw error;
 }
};

/**
 * Get basic user information (userId, name, department).
 * This endpoint is accessible to any authenticated user with case:read permission.
 * Used for displaying user names in case assignments, activity logs, etc.
 */
export const getBasicUsers = async (): Promise<{ userId: string; name: string; department?: string }[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/basic`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    
    if (!response.ok) {
      return [];
    }
    
    const users = await handleApiResponse<{ userId: string; name: string; department?: string }[]>(response);
    return users;
  } catch {
    // Return empty array for graceful degradation
    return [];
  }
};

// ✅ USER MANAGEMENT FUNCTIONS
export const createUser = async (userData: NewUserData): Promise<User> => {
 try {
   const response = await fetch(`${API_BASE_URL}/users`, {
     method: 'POST',
     headers: await getAuthHeaders(),
     credentials: 'include',
     body: JSON.stringify({
       username: userData.email.split('@')[0],
       name: userData.name,
       email: userData.email,
       password: userData.password,
       roleId: userData.roleId,
       department: userData.department,
       enabled: true
     }),
   });
   const createdUser = await handleApiResponse<BackendUser>(response);
   return mapBackendUserToFrontend(createdUser);
 } catch (error) {
   console.error("Failed to create user:", error);
   throw error;
 }
};

export const updateUser = async (userId: string, userData: Partial<User> & { password?: string }): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const updatedUser = await handleApiResponse<BackendUser>(response);
    return mapBackendUserToFrontend(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    throw error;
  }
 };

export const updateUserStatus = async (userId: string, isEnabled: boolean): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ enabled: isEnabled }),
    });
    const updatedUser = await handleApiResponse<BackendUser>(response);
    return mapBackendUserToFrontend(updatedUser);
  } catch (error) {
    console.error("Failed to update user status:", error);
    throw error;
  }
};

// ✅ CASE MANAGEMENT FUNCTIONS
export const getCases = async (): Promise<Case[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    return await handleApiResponse<Case[]>(response);
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    throw error;
  }
};

export const getCaseDetails = async (caseId: string): Promise<{
  caseData: Case;
  parties: Party[];
  documents: Document[];
  documentLinks: CaseDocumentLink[];
  scannerProfiles: ScannerProfile[];
  allUsers: { userId: string; name: string }[];
  allParties: Party[];
} | null> => {
  try {
    const headers = await getAuthHeaders();

    // Fetch case data first - if this fails, we can't proceed
    const caseResponse = await fetch(`${API_BASE_URL}/cases/${caseId}`, { 
      headers, 
      credentials: 'include' 
    });

    if (!caseResponse.ok) {
      console.error(`Failed to fetch case: ${caseResponse.status}`);
      return null;
    }

    const caseData = await handleApiResponse<Case>(caseResponse);

    // Fetch other data in parallel, but handle errors gracefully
    const [partiesResponse, documentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/parties/case/${caseId}`, { headers, credentials: 'include' })
        .catch(err => {
          console.error('Failed to fetch parties:', err);
          return null;
        }),
      fetch(`${API_BASE_URL}/documents/case/${caseId}`, { headers, credentials: 'include' })
        .catch(err => {
          console.error('Failed to fetch documents:', err);
          return null;
        }),
    ]);

    // Process parties
    let parties: Party[] = [];
    if (partiesResponse && partiesResponse.ok) {
      try {
        parties = await handleApiResponse<Party[]>(partiesResponse);
      } catch (err) {
        console.error('Failed to parse parties:', err);
      }
    }

    // Process documents
    let documents: Document[] = [];
    if (documentsResponse && documentsResponse.ok) {
      try {
        const documentsDto = await handleApiResponse<DocumentDto[]>(documentsResponse);
        
        // Transform DocumentDto to Document with UserInfo
        documents = documentsDto.map(dto => ({
          id: dto.id,
          name: dto.name || dto.documentType,
          documentType: dto.documentType,
          originalFilename: dto.originalFilename || '',
          mimeType: dto.mimeType || 'application/pdf',
          sizeInBytes: dto.sizeInBytes || 0,
          status: (dto.status || 'Missing') as DocStatus,
          version: dto.version || 1,
          ownerType: (dto.ownerType || 'CASE') as 'CASE' | 'PARTY',
          ownerId: dto.ownerId || caseId,
          
          // Transform user attribution
          uploadedBy: dto.uploadedBy ? (
            typeof dto.uploadedBy === 'object' ? dto.uploadedBy : {
              userId: 'UNKNOWN',
              username: dto.uploadedBy,
              name: dto.uploadedBy,
              department: ''
            }
          ) : null,
          
          uploadedDate: dto.uploadedDate || dto.createdDate || new Date().toISOString(),
          
          verifiedBy: dto.verifiedBy ? (
            typeof dto.verifiedBy === 'object' ? dto.verifiedBy : {
              userId: 'UNKNOWN',
              username: dto.verifiedBy,
              name: dto.verifiedBy,
              department: ''
            }
          ) : null,
          
          verifiedDate: dto.verifiedDate || null,
          
          rejectionReason: dto.rejectionReason || null,
          expiryDate: dto.expiryDate || null,
          comments: dto.comments || null,
          isCurrentForCase: dto.isCurrentForCase || false,
          isAdHoc: dto.isAdHoc || false
        }));
      } catch (err) {
        console.error('Failed to parse documents:', err);
        // Continue with empty documents array
      }
    } else if (documentsResponse) {
      console.error(`Documents endpoint returned ${documentsResponse.status}`);
    }

    // Generate document links from current documents
    const documentLinks: CaseDocumentLink[] = documents
      .filter(doc => doc.isCurrentForCase || doc.status !== 'Missing')
      .map(doc => {
        const sanitizedDocType = doc.documentType.replace(/[/\s]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
        const documentId = `DOC-${doc.ownerId}-${sanitizedDocType}`;
        
        return {
          linkId: `LNK-${caseId}-${doc.id}`,
          caseId,
          documentId,
          versionId: doc.id.toString(),
          status: doc.status,
          comments: doc.comments || undefined
        };
      });

    // Fetch additional data - these are less critical so we handle errors
    let scannerProfiles: ScannerProfile[] = [];
    let allUsers: { userId: string; name: string }[] = [];
    let allParties: Party[] = [];

    try {
      [scannerProfiles, allUsers, allParties] = await Promise.all([
        getScannerProfiles().catch(() => []),
        getBasicUsers().catch(() => []),
        getParties().catch(() => []),
      ]);
    } catch{
    }


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
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(newCaseData),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to create case:", error);
    throw error;
  }
};

export const assignCase = async (caseId: string, userId: string): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/assign`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to assign case:", error);
    throw error;
  }
};

export const updateCaseStatus = async (caseId: string, updates: { status: CaseStatus, riskLevel: RiskLevel }): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to update case status:", error);
    throw error;
  }
};

export const updateEntityData = async (caseId: string, entityData: Case['entity']): Promise<Case> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/entity`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(entityData),
    });
    return await handleApiResponse<Case>(response);
  } catch (error) {
    console.error("Failed to update entity data:", error);
    throw error;
  }
};

// ✅ ACTIVITY & CALL REPORT FUNCTIONS
export const addActivityLog = async (caseId: string, activityData: Omit<ActivityLog, 'activityId' | 'timestamp'>): Promise<Case> => {
  try {
    await fetch(`${API_BASE_URL}/cases/${caseId}/activities`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ type: activityData.type, details: activityData.details,  performedBy: activityData.performedBy }),
    });
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
    await fetch(`${API_BASE_URL}/cases/${caseId}/reports`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    const details = await getCaseDetails(caseId);
    if (!details?.caseData) throw new Error('Case not found');
    return details.caseData;
  } catch (error) {
    console.error("Failed to add call report:", error);
    throw error;
  }
};

export const updateCallReport = async (caseId: string, reportId: string, reportData: Omit<CallReport, 'reportId'>): Promise<Case> => {
  try {
    const numericId = reportId.replace('CR-', '').replace(/^0+/, '');
    await fetch(`${API_BASE_URL}/cases/${caseId}/reports/${numericId}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    const details = await getCaseDetails(caseId);
    if (!details?.caseData) throw new Error('Case not found');
    return details.caseData;
  } catch (error) {
    console.error("Failed to update call report:", error);
    throw error;
  }
};

export const deleteCallReport = async (caseId: string, reportId: string, reason?: string): Promise<void> => {
  try {
    const numericId = reportId.replace('CR-', '').replace(/^0+/, '');
    const params = new URLSearchParams();
    if (reason) params.append('reason', reason);
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/reports/${numericId}?${params}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to delete call report: ${response.status}`);
  } catch (error) {
    console.error("Failed to delete call report:", error);
    throw error;
  }
};

// ✅ ROLE MANAGEMENT FUNCTIONS
export const getRoles = async (): Promise<Record<string, Role>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    return await handleApiResponse<Record<string, Role>>(response);
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    throw error;
  }
};

export const createRole = async (roleData: { name: string; label: string; permissions: Record<string, boolean> }): Promise<Role> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(roleData),
    });
    return await handleApiResponse<Role>(response);
  } catch (error) {
    console.error("Failed to create role:", error);
    throw error;
  }
};

export const updateRoleLabel = async (roleId: number, updates: { label: string }): Promise<Role> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return await handleApiResponse<Role>(response);
  } catch (error) {
    console.error("Failed to update role label:", error);
    throw error;
  }
};

export const deleteRole = async (roleId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to delete role: ${response.status}`);
  } catch (error) {
    console.error("Failed to delete role:", error);
    throw error;
  }
};

export const updateRolePermissions = async (roleName: string, permissions: Record<string, boolean>): Promise<Role> => {
  try {
    const response = await fetch(`${API_BASE_URL}/roles/${roleName}/permissions`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ permissions }),
    });
    return await handleApiResponse<Role>(response);
  } catch (error) {
    console.error("Failed to update role permissions:", error);
    throw error;
  }
};

// ✅ PARTY MANAGEMENT FUNCTIONS
export const getParties = async (): Promise<Party[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    return await handleApiResponse<Party[]>(response);
  } catch (error) {
    console.error("Failed to fetch parties:", error);
    throw error;
  }
};

// Updated getPartyDetails function in apiClient.ts

export const getPartyDetails = async (partyId: string) => {
  try {
    const headers = await getAuthHeaders();
    
    // Fetch party info and documents in parallel
    const [partyResponse, documentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/parties/${partyId}`, { headers, credentials: 'include' }),
      fetch(`${API_BASE_URL}/documents/party/${partyId}`, { headers, credentials: 'include' })
        .catch(err => {
          console.error('Failed to fetch party documents:', err);
          return null;
        }),
    ]);

    if (!partyResponse.ok) {
      console.error(`Failed to fetch party: ${partyResponse.status}`);
      return null;
    }

    const party = await handleApiResponse<Party>(partyResponse);
    
    // Process documents with the flat structure
    let documents: Document[] = [];
    if (documentsResponse && documentsResponse.ok) {
      try {
        const documentsDto = await handleApiResponse<DocumentDto[]>(documentsResponse);
        
        // Transform DocumentDto to Document with UserInfo (same as getCaseDetails)
        documents = documentsDto.map(dto => ({
          id: dto.id,
          name: dto.name || dto.documentType,
          documentType: dto.documentType,
          originalFilename: dto.originalFilename || '',
          mimeType: dto.mimeType || 'application/pdf',
          sizeInBytes: dto.sizeInBytes || 0,
          status: (dto.status || 'Missing') as DocStatus,
          version: dto.version || 1,
          ownerType: (dto.ownerType || 'PARTY') as 'CASE' | 'PARTY',
          ownerId: dto.ownerId || partyId,
          
          // Transform user attribution
          uploadedBy: dto.uploadedBy ? (
            typeof dto.uploadedBy === 'object' ? dto.uploadedBy : {
              userId: 'UNKNOWN',
              username: dto.uploadedBy,
              name: dto.uploadedBy,
              department: ''
            }
          ) : null,
          
          uploadedDate: dto.uploadedDate || dto.createdDate || new Date().toISOString(),
          
          verifiedBy: dto.verifiedBy ? (
            typeof dto.verifiedBy === 'object' ? dto.verifiedBy : {
              userId: 'UNKNOWN',
              username: dto.verifiedBy,
              name: dto.verifiedBy,
              department: ''
            }
          ) : null,
          
          verifiedDate: dto.verifiedDate || null,
          
          rejectionReason: dto.rejectionReason || null,
          expiryDate: dto.expiryDate || null,
          comments: dto.comments || null,
          isCurrentForCase: dto.isCurrentForCase || false,
          isAdHoc: dto.isAdHoc || false
        }));

      } catch (err) {
        console.error('Failed to parse party documents:', err);
      }
    } else if (documentsResponse) {
      console.error(`Party documents endpoint returned ${documentsResponse.status}`);
    }
    
    // Fetch scanner profiles
    let scannerProfiles: ScannerProfile[] = [];
    try {
      scannerProfiles = await getScannerProfiles();
    } catch (err) {
      console.error('Failed to fetch scanner profiles:', err);
    }

    return { 
      party, 
      documents,  // Now returns flat documents array
      scannerProfiles 
    };
  } catch (error) {
    console.error(`Failed to fetch party details for ${partyId}:`, error);
    throw error;
  }
};

export const createParty = async (partyData: Omit<Party, 'partyId'>): Promise<Party> => {
  try {
    const response = await fetch(`${API_BASE_URL}/parties`, {
      method: 'POST',
      headers: await getAuthHeaders(),
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
    // 🔍 ADD DEBUG LOGGING
    console.log('=== API CLIENT updateParty DEBUG ===');
    console.log('partyId:', partyId);
    console.log('partyData.isPEP:', partyData.isPEP, typeof partyData.isPEP);
    console.log('partyData.pepRemarks:', partyData.pepRemarks, typeof partyData.pepRemarks);  // 🔧 ADD: Debug remarks
    console.log('Full partyData being sent:', partyData);
    
    // 🔍 DEBUG THE JSON SERIALIZATION
    const jsonBody = JSON.stringify(partyData);
    console.log('JSON.stringify result:', jsonBody);
    console.log('Parsed back:', JSON.parse(jsonBody));
    
    const response = await fetch(`${API_BASE_URL}/parties/${partyId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: jsonBody,
    });
    
    // 🔍 DEBUG THE RESPONSE
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await handleApiResponse<Party>(response);
    
    // 🔍 DEBUG THE PARSED RESPONSE
    console.log('API response isPEP:', result.isPEP, typeof result.isPEP);
    console.log('API response pepRemarks:', result.pepRemarks, typeof result.pepRemarks);  // 🔧 ADD: Debug remarks
    console.log('Full API response:', result);
    
    return result;
  } catch (error) {
    console.error("Failed to update party:", error);
    throw error;
  }
};

export const addRelatedParty = async (caseId: string, partyData: { partyId: string; name: string; relationshipType: string; ownershipPercentage?: number }): Promise<RelatedPartyDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(partyData),
    });
    return await handleApiResponse<RelatedPartyDto>(response);
  } catch (error) {
    console.error("Failed to add related party:", error);
    throw error;
  }
};

export const removeRelatedParty = async (caseId: string, partyId: string, relationshipType: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties/${partyId}?relationshipType=${encodeURIComponent(relationshipType)}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to remove party: ${response.status}`);
  } catch (error) {
    console.error("Failed to remove related party:", error);
    throw error;
  }
};

// ✅ DOCUMENT MANAGEMENT FUNCTIONS
export const uploadDocument = async (
  ownerId: string, 
  ownerType: 'CASE' | 'PARTY', 
  documentType: string, 
  file: File, 
  metadata?: { 
    expiryDate?: string; 
    comments?: string;
    isAdHoc?: boolean;
  }
): Promise<DocumentDto> => {
  try {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    
    if (metadata?.expiryDate) formData.append('expiryDate', metadata.expiryDate);
    if (metadata?.comments) formData.append('comments', metadata.comments);
    if (metadata?.isAdHoc !== undefined) formData.append('isAdHoc', String(metadata.isAdHoc));

    const endpoint = ownerType === 'CASE'
      ? `${API_BASE_URL}/documents/upload/case/${ownerId}`
      : `${API_BASE_URL}/documents/upload/party/${ownerId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: await getAuthHeadersForUpload(),
      credentials: 'include',
      body: formData,
    });
    
    return await handleApiResponse<DocumentDto>(response);
    
  } catch (error) {
    console.error("Document upload ERROR:", error);
    throw error;
  }
};

export const updateDocumentStatus = async (documentId: number, status: string, rejectionReason?: string): Promise<DocumentDto> => {
  try {
    const params = new URLSearchParams({ status });
    if (rejectionReason) params.append('rejectionReason', rejectionReason);
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/status?${params}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
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
    const headers = await getAuthHeadersForUpload();
    const response = await fetch(`${API_BASE_URL}/documents/download/${documentId}`, {
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Failed to download document: ${response.status}`);
    return await response.blob();
  } catch (error) {
    console.error("Failed to download document:", error);
    throw error;
  }
};

export const updateDocumentLink = async (caseId: string, documentId: string, versionId: string): Promise<CaseDocumentLink> => {
  try {
    const encodedDocumentId = encodeURIComponent(documentId);
    const url = `${API_BASE_URL}/cases/${caseId}/documents/${encodedDocumentId}/link`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ versionId }),
    });
    return await handleApiResponse<CaseDocumentLink>(response);
  } catch (error) {
    console.error("Failed to update document link:", error);
    throw error;
  }
};

// ✅ SCANNER INTEGRATION
export const triggerScan = async (scanRequest: { profileName: string; ownerType: string; ownerId: string; documentType: string; format?: string; }): Promise<ScanTriggerResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scans/trigger`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(scanRequest),
    });
    return await handleApiResponse<ScanTriggerResponse>(response);
  } catch (error) {
    console.error("Failed to trigger scan:", error);
    throw error;
  }
};

export const getScannerProfiles = async (): Promise<ScannerProfile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scanner-profiles`, {
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    return await handleApiResponse<ScannerProfile[]>(response);
  } catch (error) {
    console.error("Failed to fetch scanner profiles:", error);
    throw error;
  }
};

// ✅ CONFIGURATION & TEMPLATE FUNCTIONS
export const getEnums = async (): Promise<EnumConfig> => {
  try {
    // Enums are public, so no auth headers are needed.
    const response = await fetch(`${API_BASE_URL}/enums`);
    if (!response.ok) throw new Error(`Failed to fetch enums: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch enums - using fallback:", error);
    return {
      roles: {},
      enums: {
        caseStatus: [],
        riskLevel: [],
        docStatus: [],
        entityTypes: [],
      },
      documentRequirements: {
        individualTemplates: {},
        entityTemplates: {},
        bankFormTemplates: { corporateMandatory: [], corporateOptional: [], individualStakeholder: [] },
        riskBasedDocuments: {},
        entityRoleMapping: {}
      }
    };
  }
};
// In src/lib/apiClient.ts, update the getDocumentRequirements function:

export const getDocumentRequirements = async (): Promise<DocumentRequirements> => {
  if (cachedDocumentRequirements) {
    return cachedDocumentRequirements;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/templates/document-requirements`, {
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    const data = await handleApiResponse<DocumentRequirements>(response);
    
  
    
    cachedDocumentRequirements = data;
    return data;
  } catch (error) {
    console.error('❌ Error fetching document requirements:', error);
    return {
      individualTemplates: {},
      entityTemplates: {},
      bankFormTemplates: { corporateMandatory: [], corporateOptional: [], individualStakeholder: [] },
      riskBasedDocuments: {},
      entityRoleMapping: {}
    };
  }
};

export const updateTemplate = async (
  categoryKey: string,
  typeKey: string,
  documents: TemplateDoc[]
): Promise<DocumentRequirements> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/document-requirements`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ categoryKey, typeKey, documents }),
    });
    const updatedTemplates = await handleApiResponse<DocumentRequirements>(response);
    
    clearDocumentRequirementsCache();
    cachedDocumentRequirements = updatedTemplates;
    
    return updatedTemplates;
  } catch (error) {
    console.error("Failed to update template:", error);
    throw error;
  }
};

/**
 * @deprecated This function is now obsolete. Use updateTemplate instead.
 */
export const updateDocumentRequirements = async (): Promise<DocumentRequirements | null> => {
  console.warn("DEPRECATED: updateDocumentRequirements is called. Use updateTemplate instead.");
  throw new Error("This method is deprecated. Use the new updateTemplate function.");
};

export function clearDocumentRequirementsCache() {
  cachedDocumentRequirements = null;
}

export const getCaseDocumentLinks = async (caseId: string): Promise<CaseDocumentLink[]> => {
  try {
    const documentsResponse = await fetch(`${API_BASE_URL}/documents/case/${caseId}`, { 
      headers: await getAuthHeaders(), 
      credentials: 'include' 
    });
    
    if (!documentsResponse.ok) return [];

    const documentsDto = await handleApiResponse<DocumentDto[]>(documentsResponse);
    const documentLinks: CaseDocumentLink[] = [];

    documentsDto.forEach(dto => {
      // Only include documents that are actively linked (not just 'Missing')
      if (dto.isCurrentForCase) {
        const sanitizedDocType = dto.documentType.replace(/[/\s]/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
        const documentId = `DOC-${dto.ownerId}-${sanitizedDocType}`;

        documentLinks.push({
          linkId: `LNK-${caseId}-${dto.id}`,
          caseId: caseId,
          documentId: documentId,
          versionId: dto.id.toString(),
          status: dto.status as DocStatus,
        });
      }
    });
    
    return documentLinks;
  } catch (error) {
    console.error(`Failed to fetch document links for case ${caseId}:`, error);
    return [];
  }
};
// =====================================================================
// DASHBOARD API ENDPOINTS
// =====================================================================

/**
 * Fetch dashboard statistics with time filter
 * @param timeFilter - 'week', 'month', or 'quarter'
 */
export const getDashboardStats = async (timeFilter: string = 'week'): Promise<{
  overview: {
    totalCases: number;
    inProgress: number;
    pendingApproval: number;
    active: number;
    rejected: number;
    overdue: number;
  };
  trends: {
    casesThisWeek: number;
    weeklyGrowth: number;
    avgProcessingDays: number;
  };
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  entityTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats?timeFilter=${timeFilter}`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch dashboard activity (recent and urgent cases)
 * @param limit - number of recent cases to return
 * @param includeUrgent - whether to include urgent cases
 */
export const getDashboardActivity = async (limit: number = 5, includeUrgent: boolean = true): Promise<{
  recentCases: Array<{
    caseId: string;
    entityName: string;
    entityType: string;
    status: CaseStatus;
    riskLevel: RiskLevel;
    createdDate: string;
    slaDeadline: string;
    daysUntilDeadline: number;
    deadlineStatus: 'OVERDUE' | 'URGENT' | 'NORMAL';
  }>;
  urgentCases: Array<{
    caseId: string;
    entityName: string;
    entityType: string;
    status: CaseStatus;
    riskLevel: RiskLevel;
    createdDate: string;
    slaDeadline: string;
    daysUntilDeadline: number;
    deadlineStatus: 'OVERDUE' | 'URGENT' | 'NORMAL';
  }>;
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/activity?limit=${limit}&includeUrgent=${includeUrgent}`, 
      {
        headers: await getAuthHeaders(),
        credentials: 'include'
      }
    );
    return await handleApiResponse(response);
  } catch (error) {
    console.error("Failed to fetch dashboard activity:", error);
    throw error;
  }
};

// =====================================================================
// OPTIMIZED CASE SEARCH ENDPOINT
// =====================================================================


interface CaseSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  riskLevel?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// interface CasesPageResponse {
//   data: Case[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
//   meta: {
//     appliedFilters: {
//       riskLevel: string[];
//       status: string[];
//     };
//   };
// }

export interface CaseSummary extends Case {
  missingCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

export interface CasesPageResponse {
  data: CaseSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    appliedFilters: {
      riskLevel: string[];
      status: string[];
    };
  };
}

/**
 * Search cases with server-side filtering, sorting, and pagination
 * @param params - search parameters
 */
export const searchCases = async (params: CaseSearchParams): Promise<CasesPageResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.riskLevel) queryParams.append('riskLevel', params.riskLevel);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await fetch(`${API_BASE_URL}/cases/search?${queryParams.toString()}`, {
      headers: await getAuthHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<CasesPageResponse>(response);
  } catch (error) {
    console.error("Failed to search cases:", error);
    throw error;
  }
};

// =================================================================================
// Add to FILE: src/lib/apiClient.ts
// =================================================================================

// ✅ SCANNER PROFILE FUNCTIONS

/**
 * Create a new scanner profile
 * Requires admin:manage-templates permission
 */
export const createScannerProfile = async (
  profile: Omit<ScannerProfile, 'id'>
): Promise<ScannerProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scanner-profiles`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(profile),
    });
    return await handleApiResponse<ScannerProfile>(response);
  } catch (error) {
    console.error("Failed to create scanner profile:", error);
    throw error;
  }
};

/**
 * Delete a scanner profile
 * Requires admin:manage-templates permission
 */
export const deleteScannerProfile = async (id: string): Promise<void> => {  // Changed from number to string
  try {
    const response = await fetch(`${API_BASE_URL}/scanner-profiles/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete scanner profile: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to delete scanner profile:", error);
    throw error;
  }
};

/**
 * Update a scanner profile (optional - for future use)
 * Requires admin:manage-templates permission
 */
export const updateScannerProfile = async (
  id: string,  // Changed from number to string
  updates: Partial<Omit<ScannerProfile, 'id'>>
): Promise<ScannerProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scanner-profiles/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return await handleApiResponse<ScannerProfile>(response);
  } catch (error) {
    console.error("Failed to update scanner profile:", error);
    throw error;
  }
};

export const approveAndMakeCurrent = async (documentId: number, caseId: string): Promise<DocumentDto> => {
  try {
    const params = new URLSearchParams({ caseId });
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/approve-and-make-current?${params}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    return await handleApiResponse<DocumentDto>(response);
  } catch (error) {
    console.error("Failed to approve and make current:", error);
    throw error;
  }
};

// =================================================================================
// DOCUMENT UTILITY FUNCTIONS
// =================================================================================

// Helper function to get display name from document
export const getUploaderName = (doc: Document): string => {
  return doc.uploadedBy?.name || 'Unknown';
};

export const getVerifierName = (doc: Document): string => {
  return doc.verifiedBy?.name || 'Not verified';
};

// Helper to get uploader info with department
export const getUploaderInfo = (doc: Document): string => {
  if (!doc.uploadedBy) return 'Unknown';
  if (doc.uploadedBy.department) {
    return `${doc.uploadedBy.name} (${doc.uploadedBy.department})`;
  }
  return doc.uploadedBy.name;
};

// Group documents by type (useful for displaying in UI)
export const groupDocumentsByType = (documents: Document[]): Record<string, Document[]> => {
  return documents.reduce((acc, doc) => {
    if (!acc[doc.documentType]) {
      acc[doc.documentType] = [];
    }
    acc[doc.documentType].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);
};

// Get the current version for a document type
export const getCurrentVersion = (documents: Document[], documentType: string): Document | undefined => {
  return documents
    .filter(doc => doc.documentType === documentType && doc.isCurrentForCase)
    .sort((a, b) => b.version - a.version)[0];
};

// Get all versions for a document type
export const getDocumentVersions = (documents: Document[], documentType: string, ownerId: string): Document[] => {
  return documents
    .filter(doc => doc.documentType === documentType && doc.ownerId === ownerId)
    .sort((a, b) => b.version - a.version);
};

// =================================================================================
// NEW API FUNCTIONS TO ADD TO: src/lib/apiClient.ts
// =================================================================================

// Add these functions to your existing apiClient.ts file

/**
 * Update party relationships for a case
 * This replaces all existing relationships for this party in the case
 */
export const updatePartyRelationships = async (
  caseId: string, 
  partyId: string, 
  relationships: { type: string; ownershipPercentage?: number }[]
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties/${partyId}/relationships`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ relationships }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update party relationships: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to update party relationships:", error);
    throw error;
  }
};

/**
 * Remove a specific relationship type from a party in a case
 * This removes only one relationship type, not the entire party
 */
export const removePartyRelationship = async (
  caseId: string, 
  partyId: string, 
  relationshipType: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties/${partyId}/relationships/${encodeURIComponent(relationshipType)}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove party relationship: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to remove party relationship:", error);
    throw error;
  }
};

/**
 * Remove all relationships for a party from a case (removes the party entirely)
 * This is different from removeRelatedParty which removes by relationship type
 */
export const removePartyFromCase = async (
  caseId: string, 
  partyId: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/parties/${partyId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove party from case: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to remove party from case:", error);
    throw error;
  }
};