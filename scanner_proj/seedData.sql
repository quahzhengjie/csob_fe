-- =================================================================================
-- BKB SCANNER: COMPLETE DATABASE SEED SCRIPT
-- =================================================================================
-- This script populates the database with comprehensive initial data for
-- permissions, roles, users, parties, cases, and related entities.
-- Updated to include the new schema changes.
-- =================================================================================

USE opa_database;

-- =================================================================================
-- SECTION 1: RBAC (Role-Based Access Control) Setup
-- =================================================================================

-- Insert Permissions
INSERT INTO `csob_permissions` (id, name) VALUES
(1, 'case:read'),
(2, 'case:update'),
(3, 'case:approve'),
(4, 'document:upload'),
(5, 'document:read'),
(6, 'document:verify'),
(7, 'admin:manage-users'),
(8, 'admin:manage-templates')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Roles
INSERT INTO `csob_roles` (id, name, label, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'ROLE_MANAGER', 'General Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'ROLE_PROCESSOR', 'Deposits Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'ROLE_VIEWER', 'Read-Only User', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'ROLE_COMPLIANCE', 'Compliance Officer', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'ROLE_ADMIN', 'System Administrator', 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), label=VALUES(label);

-- Link Permissions to Roles
-- Manager Role Permissions
INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- Processor Role Permissions
INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 4), (2, 5)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- Viewer Role Permissions
INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(3, 1), (3, 5)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- Compliance Role Permissions
INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(4, 1), (4, 3), (4, 5), (4, 6)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- Admin Role Permissions
INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8)
ON DUPLICATE KEY UPDATE role_id=VALUES(role_id);

-- =================================================================================
-- SECTION 2: User Setup
-- =================================================================================

-- Insert Users (password for all: "password")
INSERT INTO `csob_users` (user_id, username, password, enabled, created_by, created_date, last_modified_by, last_modified_date) VALUES
('USER-001', 'manager', '$2a$10$AtElM0d0H3pu5/Fs633a/Oc5VJqqfwa2STswz2QS1zoxf9PLEF/di', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-002', 'processor', '$2a$10$AtElM0d0H3pu5/Fs633a/Oc5VJqqfwa2STswz2QS1zoxf9PLEF/di', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-003', 'viewer', '$2a$10$AtElM0d0H3pu5/Fs633a/Oc5VJqqfwa2STswz2QS1zoxf9PLEF/di', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-004', 'compliance', '$2a$10$AtElM0d0H3pu5/Fs633a/Oc5VJqqfwa2STswz2QS1zoxf9PLEF/di', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-005', 'admin', '$2a$10$AtElM0d0H3pu5/Fs633a/Oc5VJqqfwa2STswz2QS1zoxf9PLEF/di', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Link Roles to Users
INSERT INTO `csob_user_roles` (user_id, role_id) VALUES
('USER-001', 1), -- manager has ROLE_MANAGER
('USER-002', 2), -- processor has ROLE_PROCESSOR
('USER-003', 3), -- viewer has ROLE_VIEWER
('USER-004', 4), -- compliance has ROLE_COMPLIANCE
('USER-005', 5)  -- admin has ROLE_ADMIN
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- =================================================================================
-- SECTION 3: Application Configuration
-- =================================================================================

-- Insert the document requirements template
INSERT INTO `csob_kyc_configurations` (config_key, config_value) VALUES
('DOCUMENT_REQUIREMENTS_TEMPLATE', '{
  "individualTemplates": {
    "Singaporean/PR": [
      {"name": "NRIC / Birth Certificate", "required": true}
    ],
    "Foreigner": [
      {"name": "Passport", "required": true, "validityMonths": 6}, 
      {"name": "Work Permit / Employment Pass / FIN Card", "required": true, "note": "Required only if employed in Singapore."}, 
      {"name": "Proof of Residential Address", "required": true, "validityMonths": 3}
    ]
  },
  "entityTemplates": {
    "Non-Listed Company": [
      {"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}, 
      {"name": "Certificate of Incorporation", "required": true}, 
      {"name": "Memorandum & Articles of Association (M&A) / Constitution", "required": true}
    ],
    "Partnership": [
      {"name": "Partnership Deed or Agreement", "required": true}
    ],
    "Trust Account": [
      {"name": "Trust Deed or Indenture of Trust", "required": true}
    ]
  },
  "bankFormTemplates": {
    "corporate": ["Account Application Form", "Board Resolutions", "Declaration of Beneficial Owner(s) Form"],
    "individualStakeholder": ["FATCA & CRS Supplemental Form for Individuals"]
  },
  "riskBasedDocuments": {
    "High": [
      {"name": "Source of Wealth Declaration", "required": true},
      {"name": "Financial Statements (Latest 2 Years)", "required": true}
    ]
  },
  "entityRoleMapping": {
    "Non-Listed Company": ["Director", "Authorised Signatory", "Beneficial Owner", "Shareholder"],
    "Partnership": ["Partner", "Authorised Signatory"],
    "Trust Account": ["Trustee", "Settlor", "Protector", "Beneficiary"]
  }
}')
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);

-- =================================================================================
-- SECTION 4: Master Party Data (Individuals)
-- =================================================================================

-- Insert Sample Parties
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
('High Quality Color', '300dpi', 'Color', 'ADF', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('Fast Grayscale', '200dpi', 'Grayscale', 'ADF', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('Archive Quality', '600dpi', 'Color', 'Flatbed', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- =================================================================================
-- SECTION 6: Sample Case Data with Entity Information
-- =================================================================================

-- Insert Sample Cases with embedded entity data
INSERT INTO `csob_cases` (
    case_id, status, risk_level, workflow_stage, sla_deadline, 
    -- Entity data columns
    customer_id, entity_name, entity_type, basic_number, cis_number, 
    tax_id, address1, address2, address_country, place_of_incorporation, 
    us_fatca_classification_final,
    -- Credit details columns
    credit_limit, credit_score, assessment_notes,
    -- Other columns
    assigned_to_user_id, approved_by_user_id,
    created_by, created_date, last_modified_by, last_modified_date
) VALUES
(
    'CASE-2025-001', 'KYC Review', 'High', 'document_collection', '2025-07-22 10:00:00',
    'CUST-001', 'Tech Innovations Pte Ltd', 'Non-Listed Company', NULL, NULL,
    'T21-12345A', '123 Tech Street', '#04-56', 'Singapore', 'Singapore',
    'Active NFFE',
    500000.00, 'A+', 'Established tech company with strong financials',
    'USER-002', NULL,
    'SYSTEM', NOW(), 'SYSTEM', NOW()
),
(
    'CASE-2025-002', 'Pending Approval', 'Medium', 'pending_approval', '2025-07-17 14:00:00',
    'CUST-002', 'Lim Family Trust', 'Trust Account', 'B-102345', NULL,
    'T21-12345Z', '456 Family Ave', NULL, 'Singapore', 'Singapore',
    'Passive NFFE',
    1000000.00, 'A', 'High net worth family trust',
    'USER-002', NULL,
    'SYSTEM', NOW(), 'SYSTEM', NOW()
),
(
    'CASE-2025-003', 'Active', 'Low', 'completed', '2025-07-12 09:00:00',
    'CUST-003', 'Global Exports LLP', 'Partnership', 'B-102301', 'C-987123',
    'P22-98765X', '789 Trade Hub', NULL, 'Singapore', 'Singapore',
    'Active NFFE',
    250000.00, 'B+', 'Trading company with moderate volume',
    NULL, 'USER-001',
    'SYSTEM', NOW(), 'SYSTEM', NOW()
),
(
    'CASE-2025-004', 'Prospect', 'Low', 'prospect', '2025-07-25 18:00:00',
    'CUST-004', 'Innovation Partners', 'Partnership', NULL, NULL,
    'TBC', 'TBC', NULL, 'Singapore', 'Singapore',
    'TBC',
    NULL, NULL, NULL,
    'USER-001', NULL,
    'SYSTEM', NOW(), 'SYSTEM', NOW()
)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- =================================================================================
-- SECTION 7: Link Parties to Cases (Related Parties)
-- =================================================================================

INSERT INTO `csob_related_parties` (case_id, party_id, name, relationship_type, ownership_percentage, created_by, created_date, last_modified_by, last_modified_date) VALUES
-- Tech Innovations case
('CASE-2025-001', 'PARTY-001', 'John Tan Keng Huat', 'Director', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-001', 'John Tan Keng Huat', 'Authorised Signatory', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-002', 'Sarah Chen Wei Ling', 'Shareholder', 40.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-005', 'Amanda Wong Shu Min', 'Shareholder', 35.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-006', 'Robert Johnson', 'Shareholder', 25.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Lim Family Trust case
('CASE-2025-002', 'PARTY-003', 'Michael Lim Boon Keng', 'Trustee', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-002', 'PARTY-001', 'John Tan Keng Huat', 'Settlor', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Global Exports case
('CASE-2025-003', 'PARTY-004', 'David Lee Hsien Yang', 'Partner', 50.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Innovation Partners prospect
('CASE-2025-004', 'PARTY-004', 'David Lee Hsien Yang', 'Partner', 50.0, 'SYSTEM', NOW(), 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- =================================================================================
-- SECTION 8: Sample Call Reports
-- =================================================================================

INSERT INTO `csob_call_reports` (case_id, call_date, summary, next_steps, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', '2025-01-14 11:00:00', 'Initial call with John Tan to discuss required documentation for Tech Innovations account opening.', 'Follow up via email with complete document checklist.', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE-2025-001', '2025-01-16 15:30:00', 'Follow-up call regarding missing documents. Client committed to providing ARCA search by end of week.', 'Check back on Friday for document submission.', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE-2025-002', '2025-01-10 10:00:00', 'Discussed trust structure and beneficiary details with Michael Lim.', 'Await trust deed submission.', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE-2025-004', '2025-01-18 14:00:00', 'Prospecting call with David Lee. Interested in opening a partnership account for new venture.', 'Schedule formal meeting next week to discuss requirements.', 'USER-001', NOW(), 'USER-001', NOW())
ON DUPLICATE KEY UPDATE summary=VALUES(summary);

-- =================================================================================
-- SECTION 9: Sample Activity Logs
-- =================================================================================

INSERT INTO `csob_activity_logs` (case_id, type, details, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'case_created', 'Case created for Tech Innovations Pte Ltd', 'USER-001', '2025-01-15 10:30:00', 'USER-001', '2025-01-15 10:30:00'),
('CASE-2025-001', 'document_uploaded', 'Uploaded ARCA / Questnet Search', 'USER-002', '2025-01-16 14:20:00', 'USER-002', '2025-01-16 14:20:00'),
('CASE-2025-001', 'party_added', 'Added John Tan Keng Huat as Director', 'USER-002', '2025-01-15 11:00:00', 'USER-002', '2025-01-15 11:00:00'),
('CASE-2025-002', 'case_created', 'Case created for Lim Family Trust', 'USER-001', '2025-01-10 09:00:00', 'USER-001', '2025-01-10 09:00:00'),
('CASE-2025-002', 'status_change', 'Status changed from KYC Review to Pending Approval', 'USER-002', '2025-01-12 16:00:00', 'USER-002', '2025-01-12 16:00:00'),
('CASE-2025-003', 'case_approved', 'Case approved by USER-001', 'USER-001', '2025-01-08 11:30:00', 'USER-001', '2025-01-08 11:30:00')
ON DUPLICATE KEY UPDATE details=VALUES(details);

-- =================================================================================
-- SECTION 10: Sample Documents (with new structure)
-- =================================================================================

-- Documents for cases
INSERT INTO `csob_documents` (
    owner_type, owner_id, document_type, original_filename, mime_type, 
    size_in_bytes, status, version, content, 
    created_by, created_date, last_modified_by, last_modified_date
) VALUES
-- Case documents
('CASE', 'CASE-2025-001', 'ARCA / Questnet Search', 'arca_search_tech_innovations.pdf', 'application/pdf', 123456, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE', 'CASE-2025-001', 'Certificate of Incorporation', 'cert_of_incorp_tech.pdf', 'application/pdf', 234567, 'Submitted', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE', 'CASE-2025-001', 'Account Application Form', 'account_app_form_tech.pdf', 'application/pdf', 345678, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE', 'CASE-2025-002', 'Trust Deed or Indenture of Trust', 'lim_family_trust_deed.pdf', 'application/pdf', 456789, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('CASE', 'CASE-2025-003', 'Partnership Deed or Agreement', 'global_exports_partnership.pdf', 'application/pdf', 567890, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),

-- Party documents
('PARTY', 'PARTY-001', 'NRIC / Birth Certificate', 'john_tan_nric.pdf', 'application/pdf', 123456, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('PARTY', 'PARTY-002', 'NRIC / Birth Certificate', 'sarah_chen_nric.pdf', 'application/pdf', 123457, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('PARTY', 'PARTY-003', 'NRIC / Birth Certificate', 'michael_lim_nric.pdf', 'application/pdf', 123458, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('PARTY', 'PARTY-004', 'NRIC / Birth Certificate', 'david_lee_nric.pdf', 'application/pdf', 123459, 'Submitted', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('PARTY', 'PARTY-006', 'Passport', 'robert_johnson_passport.pdf', 'application/pdf', 234567, 'Verified', 1, '', 'USER-002', NOW(), 'USER-002', NOW()),
('PARTY', 'PARTY-006', 'Work Permit / Employment Pass / FIN Card', 'robert_johnson_ep.pdf', 'application/pdf', 234568, 'Submitted', 1, '', 'USER-002', NOW(), 'USER-002', NOW())
ON DUPLICATE KEY UPDATE original_filename=VALUES(original_filename);

-- =================================================================================
-- End of Seed Script
-- =================================================================================