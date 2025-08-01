// =================================================================================
// FILE: src/types/enums.ts
// =================================================================================
// Defines the core shapes for our dynamic configuration data.

// NEW: Define and export the literal union types for shared, specific values.
export type CaseStatus = 'KYC Review' | 'Pending Approval' | 'Active' | 'Rejected' | 'Prospect';
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type DocStatus = 'Missing' | 'Submitted' | 'Verified' | 'Rejected' | 'Expired';

// Updated to match backend role names
export type RoleName = 'ROLE_MANAGER' | 'ROLE_PROCESSOR' | 'ROLE_VIEWER' | 'ROLE_COMPLIANCE' | 'ROLE_ADMIN';

/**
 * Defines the structure for a user role, including its permissions.
 */
export interface Role {
  label: string;
  permissions: Record<string, boolean>;
}

/**
 * Defines the top-level configuration object returned by our API.
 * This contains all roles and simple enum lists for populating UI elements.
 */
export interface EnumConfig {
  roles: Record<RoleName, Role>;
  enums: {
    caseStatus: string[];
    riskLevel: string[];
    docStatus: string[];
    entityTypes: string[];
  };
}