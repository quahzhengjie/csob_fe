-- =================================================================================
-- BKB SCANNER: FINAL, COMPLETE, AND CORRECTED DATABASE SEED SCRIPT
-- =================================================================================
-- This script resets the database and populates it with comprehensive initial data
-- that is fully aligned with the final JPA entity definitions.
-- =================================================================================

USE opa_database;

-- Disable foreign key checks to prevent errors during table drops/inserts
SET FOREIGN_KEY_CHECKS = 0;
-- Disable safe update mode for the session to allow certain operations
SET SQL_SAFE_UPDATES = 0;

-- Optional: Clean slate by dropping tables first
DROP TABLE IF EXISTS `csob_activity_logs`;
DROP TABLE IF EXISTS `csob_call_reports`;
DROP TABLE IF EXISTS `csob_documents`;
DROP TABLE IF EXISTS `csob_related_parties`;
DROP TABLE IF EXISTS `csob_cases`;
DROP TABLE IF EXISTS `csob_kyc_configurations`;
DROP TABLE IF EXISTS `csob_parties`;
DROP TABLE IF EXISTS `csob_role_permissions`;
DROP TABLE IF EXISTS `csob_user_roles`;
DROP TABLE IF EXISTS `csob_permissions`;
DROP TABLE IF EXISTS `csob_roles`;
DROP TABLE IF EXISTS `csob_scanner_profiles`;
DROP TABLE IF EXISTS `csob_users`;

-- Re-enable foreign key checks after dropping
SET FOREIGN_KEY_CHECKS = 1;


-- =================================================================================
-- SECTION 1: RBAC (Role-Based Access Control) Setup
-- =================================================================================
INSERT INTO `csob_permissions` (id, name) VALUES
(1, 'case:read'), (2, 'case:update'), (3, 'case:approve'), (4, 'document:upload'),
(5, 'document:read'), (6, 'document:verify'), (7, 'admin:manage-users'), (8, 'admin:manage-templates')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO `csob_roles` (id, name, label, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'ROLE_MANAGER', 'General Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'ROLE_PROCESSOR', 'Deposits Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'ROLE_VIEWER', 'Read-Only User', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'ROLE_COMPLIANCE', 'Compliance Officer', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'ROLE_ADMIN', 'System Administrator', 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), label=VALUES(label);

INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(2, 1), (2, 2), (2, 4), (2, 5),
(3, 1), (3, 5),
(4, 1), (4, 3), (4, 5), (4, 6),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- =================================================================================
-- SECTION 2: User Setup
-- =================================================================================
-- CORRECTED: Added new columns (name, email, role, department) to align with User entity
INSERT INTO `csob_users` (user_id, username, password, enabled, name, email, role, department, created_by, created_date, last_modified_by, last_modified_date) VALUES
('USER-001', 'manager', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Manager User', 'manager@bank.com', 'General Manager', 'Management', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-002', 'processor', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Processor User', 'processor@bank.com', 'Deposits Manager', 'Deposits', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-003', 'viewer', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Viewer User', 'viewer@bank.com', 'Read-Only User', 'Audit', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-004', 'compliance', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Compliance User', 'compliance@bank.com', 'Compliance Officer', 'Compliance', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-005', 'admin', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Admin User', 'admin@bank.com', 'System Administrator', 'IT', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-006', 'disableduser', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 0, 'Disabled User', 'disabled@bank.com', 'Read-Only User', 'Audit', 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO `csob_user_roles` (user_id, role_id) VALUES
('USER-001', 1), ('USER-002', 2), ('USER-003', 3), ('USER-004', 4), ('USER-005', 5), ('USER-006', 3)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- =================================================================================
-- SECTION 3: Application Configuration
-- =================================================================================
INSERT INTO `csob_kyc_configurations` (config_key, config_value) VALUES
('DOCUMENT_REQUIREMENTS_TEMPLATE', '{
  "individualTemplates": {
    "Singaporean/PR": [{"name": "Identity Document / NRIC / Birth Certificate", "required": true}],
    "Foreigner": [{"name": "Passport", "required": true, "validityMonths": 6}, {"name": "Work Permit / Employment Pass", "required": true, "description": "(Only if employed in SG)"}, {"name": "Proof of Residential Address", "required": true, "validityMonths": 3, "description": "(Needed if address not on ID)"}]
  },
  "entityTemplates": {
  "Individual Account": [],
    "Non-Listed Company": [{"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}, {"name": "Certificate of Incorporation", "required": true}, {"name": "Memorandum & Articles of Association", "required": true}],
    "Joint Account": [], "Joint Account (Non-resident)": [],
    "Partnership": [{"name": "Certificate of Partnership", "required": true}, {"name": "Partnership Deed / Agreement", "required": true}, {"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}],
    "Sole Proprietorship": [{"name": "Certificate of Business Registration", "required": true}, {"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}],
    "Societies/MCST": [{"name": "Certificate of Registration / ROS Letter", "required": true}, {"name": "Extract of Office Bearers", "required": true, "validityMonths": 1}, {"name": "Constitution / Bye-Laws", "required": true}, {"name": "Committee / Council Resolution", "required": true, "validityMonths": 2}],
    "Trust Account": [{"name": "Declaration of Trusts / Registration", "required": true}, {"name": "Trust Deed or Indenture of Trust", "required": true, "description": "(Sighted & CTC by bank officer)"}, {"name": "Trustee Resolution", "required": true, "validityMonths": 2}],
    "Listed Company": [{"name": "Latest Annual Report (extract)", "required": true}],
    "Complex Corporation": [{"name": "Detailed Ownership Structure Chart", "required": true}],
    "Local Regulated Company": [{"name": "Regulator Licence / Approval Letter", "required": true}],
    "Foundation": [{"name": "Foundation Charter", "required": true}, {"name": "Council / Board List", "required": true}],
    "Non-Profit Organization": [{"name": "Certified Constitution / Bye-Laws", "required": true}, {"name": "Latest Office Bearers List", "required": true}],
    "Bank": [{"name": "Regulatory Approval / Bank Licence", "required": true}, {"name": "Certificate of Incorporation", "required": true}],
    "Foreign Govt. Organization": [{"name": "Official Authorisation Letter", "required": true}, {"name": "Constitutional Documents", "required": true}]
  },
  "bankFormTemplates": {
    "corporateMandatory": ["Signature Card", "Board Resolutions", "Account Application Form", "E-Statement Application Form", "Declaration of Beneficial Owner(s) Form", "FATCA & CRS Classification (Entities)", "FATCA & CRS Self-Certification (Non-Individuals)", "FATCA - IRS W-8 BEN-E or W-9", "PDPA & Marketing Consent Form", "KYC Form"],
    "corporateOptional": ["GM Approval Memo (Exception Case)", "Cheque Book Requisition Form", "Information Update Form (Corporate)", "Authority & Indemnity for Verbal Disclosure", "Letter of Agreement on Customer Apps for Banking Services"],
    "individualStakeholder": ["Signature Card", "Account Application Form", "Mandate Form", "E-Statement Application Form", "FATCA & CRS Supplemental Form (Individuals)", "FATCA - IRS W-8BEN or W-9", "PDPA & Marketing Consent Form"]
  },
  "riskBasedDocuments": { "High": [ { "name": "Source of Wealth Declaration", "required": true } ] },
  "entityRoleMapping": {
    "Non-Listed Company": ["Director", "Top Executive", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"],
    "Partnership": ["Partner", "Manager (LLP)", "Authorised Signatory", "Beneficial Owner", "Power of Attorney"],
    "Sole Proprietorship": ["Sole Proprietor", "Authorised Signatory", "Beneficial Owner"],
    "Societies/MCST": ["Chairman", "Secretary", "Treasurer", "Executive Authority", "Authorised Signatory", "Beneficial Owner"],
    "Trust Account": ["Trustee", "Settlor", "Protector", "Authorised Signatory", "Beneficiary", "Ultimate Controller"]
  }
}') ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);

-- =================================================================================
-- SECTION 4: Master Party Data (Individuals)
-- =================================================================================
INSERT INTO `csob_parties` (party_id, name, first_name, last_name, residency_status, id_type, identity_no, birth_date, employment_status, employer_name, is_pep, pep_country, created_by, created_date, last_modified_by, last_modified_date) VALUES
('PARTY-001', 'John Tan Keng Huat', 'John', 'Tan Keng Huat', 'Singaporean/PR', 'NRIC', 'S8012345A', '1980-03-15', 'Employed', 'Tech Innovations Pte Ltd', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-002', 'Sarah Chen Wei Ling', 'Sarah', 'Chen Wei Ling', 'Singaporean/PR', 'NRIC', 'S8523456B', '1985-07-22', 'Self-Employed', 'Chen Holdings', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-003', 'Michael Lim Boon Keng', 'Michael', 'Lim Boon Keng', 'Singaporean/PR', 'NRIC', 'S7534567C', '1975-11-08', 'Employed', 'Lim Family Office', 1, 'Singapore', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-004', 'David Lee Hsien Yang', 'David', 'Lee Hsien Yang', 'Singaporean/PR', 'NRIC', 'S7045678D', '1970-05-20', 'Employed', 'Global Exports LLP', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-005', 'Amanda Wong Shu Min', 'Amanda', 'Wong Shu Min', 'Singaporean/PR', 'NRIC', 'S9012345E', '1990-09-10', 'Employed', 'Tech Innovations Pte Ltd', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-006', 'Robert Johnson', 'Robert', 'Johnson', 'Foreigner', 'Passport', 'US123456789', '1978-02-28', 'Employed', 'Tech Innovations Pte Ltd', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- =================================================================================
-- SECTION 5: Scanner Profiles
-- =================================================================================
INSERT INTO `csob_scanner_profiles` (name, resolution, color_mode, source, is_default, created_by, created_date, last_modified_by, last_modified_date) VALUES
('EDP_FUJI', '300dpi', 'Color', 'ADF', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('EPSON_MAC', '200dpi', 'Grayscale', 'ADF', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('Archive Quality', '600dpi', 'Color', 'Flatbed', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- =================================================================================
-- SECTION 6: Sample Case Data with Entity Information
-- =================================================================================
INSERT INTO `csob_cases` (case_id, status, risk_level, workflow_stage, sla_deadline, customer_id, entity_name, entity_type, basic_number, cis_number, tax_id, address1, address2, address_country, place_of_incorporation, us_fatca_classification_final, credit_limit, credit_score, assessment_notes, assigned_to_user_id, approved_by_user_id, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'KYC Review', 'High', 'document_collection', NOW() + INTERVAL 10 DAY, 'CUST-001', 'Tech Innovations Pte Ltd', 'Non-Listed Company', NULL, NULL, 'T21-12345A', '123 Tech Street', '#04-56', 'Singapore', 'Singapore', 'Active NFFE', 500000.00, 'A+', 'Established tech company with strong financials', 'USER-002', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-002', 'Pending Approval', 'Medium', 'pending_approval', NOW() + INTERVAL 5 DAY, 'CUST-002', 'Lim Family Trust', 'Trust Account', 'B-102345', NULL, 'T21-12345Z', '456 Family Ave', NULL, 'Singapore', 'Singapore', 'Passive NFFE', 1000000.00, 'A', 'High net worth family trust', 'USER-002', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-003', 'Active', 'Low', 'completed', NOW() - INTERVAL 5 DAY, 'CUST-003', 'Global Exports LLP', 'Partnership', 'B-102301', 'C-987123', 'P22-98765X', '789 Trade Hub', NULL, 'Singapore', 'Singapore', 'Active NFFE', 250000.00, 'B+', 'Trading company with moderate volume', NULL, 'USER-001', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-004', 'Rejected', 'Low', 'completed', NOW() - INTERVAL 2 DAY, 'CUST-004', 'Innovation Partners', 'Partnership', NULL, NULL, 'TBC', 'TBC', NULL, 'Singapore', 'Singapore', 'TBC', NULL, NULL, NULL, 'USER-001', 'USER-001', 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- =================================================================================
-- SECTION 7: Link Parties to Cases (Related Parties)
-- =================================================================================
INSERT INTO `csob_related_parties` (case_id, party_id, relationship_type, ownership_percentage, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'PARTY-001', 'Director', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-002', 'Shareholder', 40.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-005', 'Shareholder', 35.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-006', 'Shareholder', 25.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-002', 'PARTY-003', 'Trustee', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-003', 'PARTY-004', 'Partner', 50.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-004', 'PARTY-004', 'Partner', 50.0, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE relationship_type=VALUES(relationship_type);

-- =================================================================================
-- SECTION 8: Sample Call Reports
-- =================================================================================
INSERT INTO `csob_call_reports` (case_id, call_date, summary, next_steps, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', NOW() - INTERVAL 10 DAY, 'Initial call with John Tan to discuss required documentation.', 'Follow up via email with complete document checklist.', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE-2025-002', NOW() - INTERVAL 9 DAY, 'Discussed trust structure with Michael Lim.', 'Await trust deed submission.', 'USER-002', NOW(), 'USER-002', NOW())
ON DUPLICATE KEY UPDATE summary=VALUES(summary);

-- =================================================================================
-- SECTION 9: Sample Activity Logs
-- =================================================================================
INSERT INTO `csob_activity_logs` (case_id, type, details, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'case_created', 'Case created for Tech Innovations Pte Ltd', 'USER-001', NOW(), 'USER-001', NOW()),
('CASE-2025-002', 'status_change', 'Status changed from KYC Review to Pending Approval', 'USER-002', NOW(), 'USER-002', NOW())
ON DUPLICATE KEY UPDATE details=VALUES(details);

-- =================================================================================
-- SECTION 10: Sample Documents
-- =================================================================================
-- CORRECTED: Added new 'name' column and other metadata columns
INSERT INTO `csob_documents` (owner_type, owner_id, case_id, party_id, document_type, name, original_filename, mime_type, size_in_bytes, status, version, content, expiry_date, rejection_reason, uploaded_by, verified_by, verified_date, comments, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'ARCA / Questnet Search', 'ARCA / Questnet Search', 'arca.pdf', 'application/pdf', 123456, 'Verified', 1, NULL, NOW() + INTERVAL 1 YEAR, NULL, 'USER-002', 'USER-001', NOW(), NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Certificate of Incorporation', 'Certificate of Incorporation', 'cert.pdf', 'application/pdf', 234567, 'Submitted', 1, NULL, NULL, NULL, 'USER-002', NULL, NULL, 'Please review', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY', 'PARTY-001', NULL, 'PARTY-001', 'NRIC / Birth Certificate', 'NRIC / Birth Certificate', 'john_tan_nric.pdf', 'application/pdf', 123456, 'Verified', 1, NULL, NOW() + INTERVAL 5 YEAR, NULL, 'USER-002', 'USER-004', NOW(), NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY', 'PARTY-006', NULL, 'PARTY-006', 'Passport', 'Passport', 'robert_johnson_passport.pdf', 'application/pdf', 234567, 'Rejected', 1, NULL, NOW() - INTERVAL 1 MONTH, 'Signature does not match', 'USER-002', 'USER-004', NOW(), 'Signature issue', 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE original_filename=VALUES(original_filename);

-- =================================================================================
-- End of Seed Script
-- =================================================================================
-- Re-enable safe updates as a good practice
SET SQL_SAFE_UPDATES = 1;
