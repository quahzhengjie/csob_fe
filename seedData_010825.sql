-- =================================================================================
-- BKB SCANNER: COMPLETE DATABASE SEED SCRIPT WITH MAKE CURRENT FUNCTIONALITY
-- =================================================================================
-- This script includes the is_current_for_case column and multiple document versions
-- =================================================================================

USE opa_database;

-- Disable foreign key checks to prevent errors during table drops/inserts
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Clean slate by dropping tables first
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
-- RECREATE TABLES WITH PROPER STRUCTURE
-- =================================================================================

-- Create documents table with is_current_for_case column
CREATE TABLE `csob_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_type` varchar(255) NOT NULL,
  `owner_id` varchar(255) NOT NULL,
  `case_id` varchar(255) DEFAULT NULL,
  `party_id` varchar(255) DEFAULT NULL,
  `document_type` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `size_in_bytes` bigint DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `version` int DEFAULT 1,
  `content` longblob,
  `expiry_date` datetime(6) DEFAULT NULL,
  `rejection_reason` text,
  `uploaded_by` varchar(255) DEFAULT NULL,
  `verified_by` varchar(255) DEFAULT NULL,
  `verified_date` datetime(6) DEFAULT NULL,
  `comments` text,
  `is_current_for_case` boolean NOT NULL DEFAULT FALSE,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_document_lookup` (`owner_type`,`owner_id`,`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =================================================================================
-- SECTION 1: RBAC (Role-Based Access Control) Setup
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `csob_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `label` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `csob_role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_permissions` (id, name) VALUES
(1, 'case:read'), (2, 'case:update'), (3, 'case:approve'), (4, 'document:upload'),
(5, 'document:read'), (6, 'document:verify'), (7, 'admin:manage-users'), (8, 'admin:manage-templates');

INSERT INTO `csob_roles` (id, name, label, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'ROLE_MANAGER', 'General Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'ROLE_PROCESSOR', 'Deposits Manager', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'ROLE_VIEWER', 'Read-Only User', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'ROLE_COMPLIANCE', 'Compliance Officer', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'ROLE_ADMIN', 'System Administrator', 'SYSTEM', NOW(), 'SYSTEM', NOW());

INSERT INTO `csob_role_permissions` (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(2, 1), (2, 2), (2, 4), (2, 5), (2, 6),
(3, 1), (3, 5),
(4, 1), (4, 3), (4, 5), (4, 6),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8);

-- =================================================================================
-- SECTION 2: User Setup
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_users` (
  `user_id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `enabled` boolean DEFAULT TRUE,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `csob_user_roles` (
  `user_id` varchar(255) NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_users` (user_id, username, password, enabled, name, email, role, department, created_by, created_date, last_modified_by, last_modified_date) VALUES
('USER-001', 'manager', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Manager User', 'manager@bank.com', 'General Manager', 'Management', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-002', 'processor', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Processor User', 'processor@bank.com', 'Deposits Manager', 'Deposits', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-003', 'viewer', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Viewer User', 'viewer@bank.com', 'Read-Only User', 'Audit', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-004', 'compliance', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Compliance User', 'compliance@bank.com', 'Compliance Officer', 'Compliance', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-005', 'admin', '$2a$10$Y7DIOeHw7/piw0TyuuM/PurFPI26FMzufOrSPrlWYzV9pCV3nstZO', 1, 'Admin User', 'admin@bank.com', 'System Administrator', 'IT', 'SYSTEM', NOW(), 'SYSTEM', NOW());

INSERT INTO `csob_user_roles` (user_id, role_id) VALUES
('USER-001', 1), ('USER-002', 2), ('USER-003', 3), ('USER-004', 4), ('USER-005', 5);

-- =================================================================================
-- SECTION 3: Application Configuration
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_kyc_configurations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_key` varchar(255) NOT NULL UNIQUE,
  `config_value` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_kyc_configurations` (config_key, config_value) VALUES
('DOCUMENT_REQUIREMENTS_TEMPLATE', '{
  "individualTemplates": {
    "Singaporean/PR": [{"name": "Identity Document / NRIC / Birth Certificate", "required": true}],
    "Foreigner": [
      {"name": "Passport", "required": true, "validityMonths": 6}, 
      {"name": "Work Permit / Employment Pass", "required": true, "description": "(Only if employed in SG)"}, 
      {"name": "Proof of Residential Address", "required": true, "validityMonths": 3, "description": "(Needed if address not on ID)"}
    ]
  },
  "entityTemplates": {
    "Individual Account": [],
    "Non-Listed Company": [
      {"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}, 
      {"name": "Certificate of Incorporation", "required": true}, 
      {"name": "Memorandum & Articles of Association", "required": true}
    ],
    "Partnership": [
      {"name": "Certificate of Partnership", "required": true}, 
      {"name": "Partnership Deed / Agreement", "required": true}, 
      {"name": "ARCA / Questnet Search", "required": true, "validityMonths": 1}
    ],
    "Trust Account": [
      {"name": "Declaration of Trusts / Registration", "required": true}, 
      {"name": "Trust Deed or Indenture of Trust", "required": true, "description": "(Sighted & CTC by bank officer)"}, 
      {"name": "Trustee Resolution", "required": true, "validityMonths": 2}
    ]
  },
  "bankFormTemplates": {
    "corporateMandatory": ["Signature Card", "Board Resolutions", "Account Application Form"],
    "corporateOptional": ["GM Approval Memo (Exception Case)", "Cheque Book Requisition Form"],
    "individualStakeholder": ["Signature Card", "Account Application Form", "Mandate Form"]
  },
  "riskBasedDocuments": { 
    "High": [{"name": "Source of Wealth Declaration", "required": true}] 
  },
  "entityRoleMapping": {
    "Non-Listed Company": ["Director", "Top Executive", "Authorised Signatory", "Beneficial Owner"],
    "Partnership": ["Partner", "Manager (LLP)", "Authorised Signatory", "Beneficial Owner"],
    "Trust Account": ["Trustee", "Settlor", "Protector", "Beneficiary"]
  }
}');

-- =================================================================================
-- SECTION 4: Master Party Data
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_parties` (
  `party_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `residency_status` varchar(255) DEFAULT NULL,
  `id_type` varchar(255) DEFAULT NULL,
  `identity_no` varchar(255) DEFAULT NULL,
  `birth_date` varchar(255) DEFAULT NULL,
  `employment_status` varchar(255) DEFAULT NULL,
  `employer_name` varchar(255) DEFAULT NULL,
  `is_pep` boolean DEFAULT FALSE,
  `pep_country` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`party_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_parties` (party_id, name, first_name, last_name, residency_status, id_type, identity_no, birth_date, employment_status, employer_name, is_pep, pep_country, created_by, created_date, last_modified_by, last_modified_date) VALUES
('PARTY-001', 'John Tan Keng Huat', 'John', 'Tan Keng Huat', 'Singaporean/PR', 'NRIC', 'S8012345A', '1980-03-15', 'Employed', 'Tech Innovations Pte Ltd', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-002', 'Sarah Chen Wei Ling', 'Sarah', 'Chen Wei Ling', 'Singaporean/PR', 'NRIC', 'S8523456B', '1985-07-22', 'Self-Employed', 'Chen Holdings', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-003', 'Michael Lim Boon Keng', 'Michael', 'Lim Boon Keng', 'Singaporean/PR', 'NRIC', 'S7534567C', '1975-11-08', 'Employed', 'Lim Family Office', 1, 'Singapore', 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-006', 'Robert Johnson', 'Robert', 'Johnson', 'Foreigner', 'Passport', 'US123456789', '1978-02-28', 'Employed', 'Tech Innovations Pte Ltd', 0, NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =================================================================================
-- SECTION 5: Scanner Profiles
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_scanner_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `resolution` varchar(255) DEFAULT NULL,
  `color_mode` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `is_default` boolean DEFAULT FALSE,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_scanner_profiles` (name, resolution, color_mode, source, is_default, created_by, created_date, last_modified_by, last_modified_date) VALUES
('EDP_FUJI', '300dpi', 'Color', 'ADF', 1, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('EPSON_MAC', '200dpi', 'Grayscale', 'ADF', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('Archive Quality', '600dpi', 'Color', 'Flatbed', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =================================================================================
-- SECTION 6: Sample Cases
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_cases` (
  `case_id` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `risk_level` varchar(255) DEFAULT NULL,
  `workflow_stage` varchar(255) DEFAULT NULL,
  `sla_deadline` datetime(6) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `entity_name` varchar(255) DEFAULT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `basic_number` varchar(255) DEFAULT NULL,
  `cis_number` varchar(255) DEFAULT NULL,
  `tax_id` varchar(255) DEFAULT NULL,
  `address1` varchar(255) DEFAULT NULL,
  `address2` varchar(255) DEFAULT NULL,
  `address_country` varchar(255) DEFAULT NULL,
  `place_of_incorporation` varchar(255) DEFAULT NULL,
  `us_fatca_classification_final` varchar(255) DEFAULT NULL,
  `credit_limit` decimal(19,2) DEFAULT NULL,
  `credit_score` varchar(255) DEFAULT NULL,
  `assessment_notes` text,
  `assigned_to_user_id` varchar(255) DEFAULT NULL,
  `approved_by_user_id` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_cases` (case_id, status, risk_level, workflow_stage, sla_deadline, customer_id, entity_name, entity_type, basic_number, cis_number, tax_id, address1, address2, address_country, place_of_incorporation, us_fatca_classification_final, credit_limit, credit_score, assessment_notes, assigned_to_user_id, approved_by_user_id, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'KYC Review', 'High', 'document_collection', DATE_ADD(NOW(), INTERVAL 10 DAY), 'CUST-001', 'Tech Innovations Pte Ltd', 'Non-Listed Company', NULL, NULL, 'T21-12345A', '123 Tech Street', '#04-56', 'Singapore', 'Singapore', 'Active NFFE', 500000.00, 'A+', 'Established tech company with strong financials', 'USER-002', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-002', 'Pending Approval', 'Medium', 'pending_approval', DATE_ADD(NOW(), INTERVAL 5 DAY), 'CUST-002', 'Lim Family Trust', 'Trust Account', 'B-102345', NULL, 'T21-12345Z', '456 Family Ave', NULL, 'Singapore', 'Singapore', 'Passive NFFE', 1000000.00, 'A', 'High net worth family trust', 'USER-002', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =================================================================================
-- SECTION 7: Related Parties
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_related_parties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(255) NOT NULL,
  `party_id` varchar(255) NOT NULL,
  `relationship_type` varchar(255) DEFAULT NULL,
  `ownership_percentage` decimal(5,2) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_related_parties` (case_id, party_id, relationship_type, ownership_percentage, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'PARTY-001', 'Director', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-002', 'Shareholder', 40.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-001', 'PARTY-006', 'Shareholder', 25.0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('CASE-2025-002', 'PARTY-003', 'Trustee', NULL, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =================================================================================
-- SECTION 8: Call Reports
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_call_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(255) NOT NULL,
  `call_date` datetime(6) DEFAULT NULL,
  `summary` text,
  `next_steps` text,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_call_reports` (case_id, call_date, summary, next_steps, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', DATE_SUB(NOW(), INTERVAL 10 DAY), 'Initial call with John Tan to discuss required documentation.', 'Follow up via email with complete document checklist.', 'USER-002', NOW(), 'USER-002', NOW());

-- =================================================================================
-- SECTION 9: Activity Logs
-- =================================================================================

CREATE TABLE IF NOT EXISTS `csob_activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `case_id` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `details` text,
  `created_by` varchar(255) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `last_modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `csob_activity_logs` (case_id, type, details, created_by, created_date, last_modified_by, last_modified_date) VALUES
('CASE-2025-001', 'case_created', 'Case created for Tech Innovations Pte Ltd', 'USER-001', NOW(), 'USER-001', NOW());

-- =================================================================================
-- SECTION 10: Sample Documents with Multiple Versions
-- =================================================================================

-- CASE DOCUMENTS for CASE-2025-001
-- ARCA / Questnet Search - 3 versions (to test Make Current)
INSERT INTO `csob_documents` (
    owner_type, owner_id, case_id, party_id, document_type, name, 
    original_filename, mime_type, size_in_bytes, status, version, 
    content, expiry_date, rejection_reason, uploaded_by, verified_by, 
    verified_date, comments, is_current_for_case,
    created_by, created_date, last_modified_by, last_modified_date
) VALUES
-- Version 1: Old verified version
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'ARCA / Questnet Search', 'ARCA / Questnet Search', 
 'ACRA_v1.pdf', 'application/pdf', 123456, 'Verified', 1, 
 NULL, DATE_ADD(NOW(), INTERVAL 1 MONTH), NULL, 'USER-002', 'USER-001', 
 DATE_SUB(NOW(), INTERVAL 5 DAY), 'Initial version', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- Version 2: Another verified version
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'ARCA / Questnet Search', 'ARCA / Questnet Search', 
 'ACRA_v2.pdf', 'application/pdf', 123457, 'Verified', 2, 
 NULL, DATE_ADD(NOW(), INTERVAL 2 MONTH), NULL, 'USER-002', 'USER-001', 
 DATE_SUB(NOW(), INTERVAL 3 DAY), 'Updated with new directors', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 5 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Version 3: Current verified version
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'ARCA / Questnet Search', 'ARCA / Questnet Search', 
 'ACRA_v3.pdf', 'application/pdf', 123458, 'Verified', 3, 
 NULL, DATE_ADD(NOW(), INTERVAL 3 MONTH), NULL, 'USER-002', 'USER-001', 
 DATE_SUB(NOW(), INTERVAL 1 DAY), 'Latest version with all updates', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Certificate of Incorporation - 3 versions
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Certificate of Incorporation', 'Certificate of Incorporation', 
 'cert_v1.pdf', 'application/pdf', 234567, 'Rejected', 1, 
 NULL, NULL, 'Poor quality scan', 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 4 DAY), 'Rejected - needs better scan', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 6 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 6 DAY)),

('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Certificate of Incorporation', 'Certificate of Incorporation', 
 'cert_v2.pdf', 'application/pdf', 234568, 'Verified', 2, 
 NULL, NULL, NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 2 DAY), 'Good quality scan', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 3 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 3 DAY)),

('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Certificate of Incorporation', 'Certificate of Incorporation', 
 'cert_v3.pdf', 'application/pdf', 234569, 'Submitted', 3, 
 NULL, NULL, NULL, 'USER-002', NULL, 
 NULL, 'Awaiting verification', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 1 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Memorandum & Articles of Association - Single current version
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Memorandum & Articles of Association', 'Memorandum & Articles of Association', 
 'MAA.pdf', 'application/pdf', 345678, 'Verified', 1, 
 NULL, NULL, NULL, 'USER-002', 'USER-001', 
 DATE_SUB(NOW(), INTERVAL 2 DAY), 'Complete MAA', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 4 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Bank Forms
('CASE', 'CASE-2025-001', 'CASE-2025-001', NULL, 'Signature Card', 'Signature Card', 
 'sig_card.pdf', 'application/pdf', 123456, 'Verified', 1, 
 NULL, NULL, NULL, 'USER-002', 'USER-001', 
 DATE_SUB(NOW(), INTERVAL 1 DAY), 'All signatories signed', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- PARTY DOCUMENTS
-- Identity document for John Tan - Multiple versions
('PARTY', 'PARTY-001', NULL, 'PARTY-001', 'Identity Document / NRIC / Birth Certificate', 'Identity Document / NRIC / Birth Certificate', 
 'john_tan_nric_v1.pdf', 'application/pdf', 123456, 'Verified', 1, 
 NULL, DATE_ADD(NOW(), INTERVAL 5 YEAR), NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 10 DAY), 'Original NRIC', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 15 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 15 DAY)),

('PARTY', 'PARTY-001', NULL, 'PARTY-001', 'Identity Document / NRIC / Birth Certificate', 'Identity Document / NRIC / Birth Certificate', 
 'john_tan_nric_v2.pdf', 'application/pdf', 123457, 'Verified', 2, 
 NULL, DATE_ADD(NOW(), INTERVAL 5 YEAR), NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 5 DAY), 'Updated address', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 7 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- Passport for Robert Johnson - Multiple versions
('PARTY', 'PARTY-006', NULL, 'PARTY-006', 'Passport', 'Passport', 
 'robert_johnson_passport_v1.pdf', 'application/pdf', 234567, 'Rejected', 1, 
 NULL, DATE_SUB(NOW(), INTERVAL 1 MONTH), 'Expired passport', 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 20 DAY), 'Passport expired', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 25 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 25 DAY)),

('PARTY', 'PARTY-006', NULL, 'PARTY-006', 'Passport', 'Passport', 
 'robert_johnson_passport_v2.pdf', 'application/pdf', 234568, 'Verified', 2, 
 NULL, DATE_ADD(NOW(), INTERVAL 5 YEAR), NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 10 DAY), 'New passport', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 15 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 15 DAY)),

('PARTY', 'PARTY-006', NULL, 'PARTY-006', 'Passport', 'Passport', 
 'robert_johnson_passport_v3.pdf', 'application/pdf', 234569, 'Submitted', 3, 
 NULL, DATE_ADD(NOW(), INTERVAL 5 YEAR), NULL, 'USER-002', NULL, 
 NULL, 'Renewed passport - awaiting verification', FALSE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Work Permit for Robert Johnson
('PARTY', 'PARTY-006', NULL, 'PARTY-006', 'Work Permit / Employment Pass', 'Work Permit / Employment Pass', 
 'robert_wp.pdf', 'application/pdf', 345678, 'Verified', 1, 
 NULL, DATE_ADD(NOW(), INTERVAL 2 YEAR), NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 5 DAY), 'Valid EP', TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- Identity for Sarah Chen
('PARTY', 'PARTY-002', NULL, 'PARTY-002', 'Identity Document / NRIC / Birth Certificate', 'Identity Document / NRIC / Birth Certificate', 
 'sarah_chen_nric.pdf', 'application/pdf', 123456, 'Verified', 1, 
 NULL, DATE_ADD(NOW(), INTERVAL 5 YEAR), NULL, 'USER-002', 'USER-004', 
 DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, TRUE,
 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY), 'SYSTEM', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- =================================================================================
-- Verify the setup
-- =================================================================================

-- Check documents with version information
SELECT 
    id,
    owner_type,
    CASE 
        WHEN owner_type = 'CASE' THEN owner_id
        ELSE CONCAT(owner_id, ' (', (SELECT name FROM csob_parties WHERE party_id = d.owner_id), ')')
    END as owner,
    document_type,
    version,
    status,
    is_current_for_case,
    DATE_FORMAT(created_date, '%Y-%m-%d') as created
FROM csob_documents d
ORDER BY owner_type, owner_id, document_type, version;

-- Check cases
SELECT case_id, entity_name, entity_type, status, risk_level FROM csob_cases;

-- Check related parties
SELECT 
    rp.case_id,
    p.name as party_name,
    rp.relationship_type,
    rp.ownership_percentage
FROM csob_related_parties rp
JOIN csob_parties p ON rp.party_id = p.party_id
ORDER BY rp.case_id, p.name;

-- Re-enable safe updates
SET SQL_SAFE_UPDATES = 1;