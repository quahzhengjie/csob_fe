// =================================================================================
// FILE: src/features/case/utils/exceptionRules.ts
// =================================================================================
import type { Case } from '@/types/entities';

/**
 * Determines if a case should be treated as an exception case
 * Exception cases require additional corporate optional documents
 */
export const determineExceptionStatus = (caseData: Case): boolean => {
  // Manual override - if explicitly set, respect it
  if (caseData.isException !== undefined) {
    return caseData.isException;
  }

  // High-risk cases often need additional documentation
  if (caseData.riskLevel === 'High') {
    return true;
  }
  
  // Complex entity types require more scrutiny
  const complexEntityTypes = [
    'Complex Corporation',
    'Trust Account',
    'Foreign Govt. Organization',
    'Foundation',
    'Bank',
    'Non-Profit Organization'
  ];
  
  if (complexEntityTypes.includes(caseData.entity.entityType)) {
    return true;
  }
  
  // Large credit facilities need additional approvals
  if (caseData.entity.creditDetails?.totalExposure && 
      caseData.entity.creditDetails.totalExposure > 1000000) {
    return true;
  }
  
  // Cases in specific workflow stages might need exception handling
  const exceptionWorkflowStages = [
    'STAGE-004', // Senior Management Review
    'STAGE-005'  // Compliance Review
  ];
  
  if (exceptionWorkflowStages.includes(caseData.workflowStage)) {
    return true;
  }
  
  // Default: not an exception
  return false;
};

/**
 * Get a human-readable explanation of why a case is an exception
 */
export const getExceptionReason = (caseData: Case): string | null => {
  if (caseData.exceptionReason) {
    return caseData.exceptionReason;
  }

  if (caseData.isException === true) {
    return "Manually marked as exception case";
  }

  if (caseData.riskLevel === 'High') {
    return "High risk level requires additional documentation";
  }
  
  const complexEntityTypes = [
    'Complex Corporation',
    'Trust Account',
    'Foreign Govt. Organization',
    'Foundation',
    'Bank',
    'Non-Profit Organization'
  ];
  
  if (complexEntityTypes.includes(caseData.entity.entityType)) {
    return `${caseData.entity.entityType} requires enhanced due diligence`;
  }
  
  if (caseData.entity.creditDetails?.totalExposure && 
      caseData.entity.creditDetails.totalExposure > 1000000) {
    return "Large credit exposure requires additional approvals";
  }
  
  const exceptionWorkflowStages = [
    'STAGE-004',
    'STAGE-005'
  ];
  
  if (exceptionWorkflowStages.includes(caseData.workflowStage)) {
    return "Current workflow stage requires additional documentation";
  }
  
  return null;
};