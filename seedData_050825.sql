
-- =====================================================================
-- BKB SCANNER: COMPLETE DATABASE SEED SCRIPT WITH USER ATTRIBUTION
-- =====================================================================
-- This script populates all tables with test data including proper user foreign keys
-- =====================================================================

USE opa_database;

-- Disable foreign key checks during seeding
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Clean existing data (optional - comment out if you want to keep existing data)
DELETE FROM csob_activity_logs;
DELETE FROM csob_call_reports;
DELETE FROM csob_documents;
DELETE FROM csob_related_parties;
DELETE FROM csob_cases;
DELETE FROM csob_parties;
DELETE FROM csob_scanner_profiles;
DELETE FROM csob_role_permissions;
DELETE FROM csob_user_roles;
DELETE FROM csob_permissions;
DELETE FROM csob_roles;
DELETE FROM csob_users;

-- =====================================================================
-- SECTION 1: RBAC Setup - Permissions and Roles
-- =====================================================================

-- Insert permissions
INSERT INTO csob_permissions (id, name) VALUES
(1, 'case:read'),
(2, 'case:update'),
(3, 'case:approve'),
(4, 'document:upload'),
(5, 'document:read'),
(6, 'document:verify'),
(7, 'admin:manage-users'),
(8, 'admin:manage-templates');

-- Insert roles
INSERT INTO csob_roles (id, name, label, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'ROLE_MANAGER', 'General Manager', 0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'ROLE_PROCESSOR', 'Deposits Manager',0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'ROLE_VIEWER', 'Read-Only User', 0,'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'ROLE_COMPLIANCE', 'Compliance Officer',0, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'ROLE_ADMIN', 'System Administrator', 0,'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Assign permissions to roles
INSERT INTO csob_role_permissions (role_id, permission_id) VALUES
-- Manager: all case and document permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
-- Processor: case read/update, all document permissions
(2, 1), (2, 2), (2, 4), (2, 5), (2, 6),
-- Viewer: read only
(3, 1), (3, 5),
-- Compliance: read, approve, verify
(4, 1), (4, 3), (4, 5), (4, 6),
-- Admin: everything
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8);

-- =====================================================================
-- SECTION 2: Users
-- =====================================================================
-- Insert users
INSERT INTO csob_users (user_id, username, password, enabled, name, email, role, department, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
('USER-001', 'admin', '$2a$10$5VWqjwoMYnFRTTmbWCRZT.iY3WW8ny27kQuUL6K.WfAiN8sflVghO', true, 'System Administrator', 'admin@company.com', 'System Administrator', 'IT', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-002', 'sarah.chen', '$2a$10$5VWqjwoMYnFRTTmbWCRZT.iY3WW8ny27kQuUL6K.WfAiN8sflVghO', true, 'Sarah Chen', 'sarah.chen@company.com', 'Deposits Manager', 'Operations', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-003', 'john.tan', '$2a$10$5VWqjwoMYnFRTTmbWCRZT.iY3WW8ny27kQuUL6K.WfAiN8sflVghO', true, 'John Tan', 'john.tan@company.com', 'General Manager', 'Management', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-004', 'emily.wong', '$2a$10$5VWqjwoMYnFRTTmbWCRZT.iY3WW8ny27kQuUL6K.WfAiN8sflVghO', true, 'Emily Wong', 'emily.wong@company.com', 'Compliance Officer', 'Compliance', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('USER-005', 'viewer', '$2a$10$5VWqjwoMYnFRTTmbWCRZT.iY3WW8ny27kQuUL6K.WfAiN8sflVghO', true, 'Read Only User', 'viewer@company.com', 'Read-Only User', 'Operations', false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Assign roles to users
INSERT INTO csob_user_roles (user_id, role_id) VALUES
('USER-001', 5), -- admin -> Admin role
('USER-002', 2), -- sarah -> Processor role
('USER-003', 1), -- john -> Manager role
('USER-004', 4), -- emily -> Compliance role
('USER-005', 3); -- viewer -> Viewer role

-- =====================================================================
-- SECTION 3: Scanner Profiles
-- =====================================================================

INSERT INTO csob_scanner_profiles (id, name, resolution, color_mode, source, is_default, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'EDP_FUJI', '300dpi', 'Color', 'ADF', true, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'EPSON_MAC', '200dpi', 'Grayscale', 'ADF', false, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'Flatbed Color', '600dpi', 'Color', 'Flatbed', false, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 4: Parties (Individuals)
-- =====================================================================

INSERT INTO csob_parties (party_id, name, first_name, last_name, residency_status, id_type, identity_no, birth_date, employment_status, employer_name, is_pep, email, phone, address, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
('PARTY-001', 'John Tan Beng Huat', 'John', 'Tan Beng Huat', 'Singaporean/PR', 'NRIC', 'S7654321A', '1975-06-15', 'Employed', 'Tech Innovations Pte Ltd', false, 'john.tan@email.com', '+65 9123 4567', '123 Orchard Road, Singapore 238456', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-002', 'Sarah Chen Li Wei', 'Sarah', 'Chen Li Wei', 'Singaporean/PR', 'NRIC', 'S8234567B', '1982-03-22', 'Self-Employed', 'Chen Consulting', false, 'sarah.chen@email.com', '+65 9234 5678', '456 Bukit Timah Road, Singapore 267890', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-003', 'Michael Lim', 'Michael', 'Lim', 'Foreigner', 'Passport', 'E12345678', '1990-11-08', 'Employed', 'Global Bank', false, 'michael.lim@email.com', '+65 9345 6789', '789 Marina Bay, Singapore 018956', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-004', 'Jennifer Ng', 'Jennifer', 'Ng', 'Singaporean/PR', 'NRIC', 'S9012345C', '1988-09-30', 'Employed', 'Ng & Associates', false, 'jennifer.ng@email.com', '+65 9456 7890', '321 Raffles Place, Singapore 048623', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-005', 'David Wong', 'David', 'Wong', 'Singaporean/PR', 'NRIC', 'S7890123D', '1970-12-25', 'Retired', NULL, false, 'david.wong@email.com', '+65 9567 8901', '654 Clementi Road, Singapore 120654', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-006', 'Robert Johnson', 'Robert', 'Johnson', 'Foreigner', 'Passport', 'US9876543', '1985-04-18', 'Employed', 'Tech Innovations Pte Ltd', false, 'robert.j@email.com', '+65 9678 9012', '987 River Valley, Singapore 238259', false, 'SYSTEM', NOW(), 'SYSTEM', NOW());
-- =====================================================================
-- SECTION 5: Cases
-- =====================================================================
INSERT INTO csob_cases (
    case_id, status, risk_level, workflow_stage, sla_deadline,
    customer_id, entity_name, entity_type, basic_number, cis_number,
    tax_id, address1, address2, address_country, place_of_incorporation,
    us_fatca_classification_final, business_activity, contact_person,
    contact_email, contact_phone, credit_limit, credit_score, assessment_notes,
    assigned_to_user_id, is_deleted, created_by, created_date, last_modified_by, last_modified_date
) VALUES
('CASE-202508-0001', 'KYC Review', 'Medium', 'document_collection', DATE_ADD(NOW(), INTERVAL 14 DAY),
 'CUST-001', 'Tech Innovations Pte Ltd', 'Non-Listed Company', 'REG-2020-001', 'CIS-001',
 'TAX-SG-001', '1 Raffles Place', '#40-01', 'Singapore', 'Singapore',
 'Passive NFFE', 'Software development and IT consulting', 'John Tan',
 'john.tan@techinnovations.sg', '+65 6789 0123', 5000000, 'A+', 'Strong financial position with consistent growth',
 'USER-002', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),

('CASE-202508-0002', 'Pending Approval', 'High', 'review', DATE_ADD(NOW(), INTERVAL 7 DAY),
 'CUST-002', 'Global Trust Holdings', 'Trust Account', 'REG-2020-002', 'CIS-002',
 'TAX-SG-002', '80 Robinson Road', '#15-01', 'Singapore', 'British Virgin Islands',
 'Active NFFE', 'Trust and fiduciary services', 'Michael Lim',
 'michael.lim@globaltrust.com', '+65 6789 4567', 10000000, 'AA', 'High net worth clients, enhanced due diligence required',
 'USER-003', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),

('CASE-202508-0003', 'Active', 'Low', 'completed', DATE_ADD(NOW(), INTERVAL 30 DAY),
 'CUST-003', 'Chen Family Office', 'Partnership', 'REG-2019-003', 'CIS-003',
 'TAX-SG-003', '6 Battery Road', '#25-01', 'Singapore', 'Singapore',
 'Passive NFFE', 'Family investment management', 'Sarah Chen',
 'sarah@chenfamily.sg', '+65 6789 7890', 2000000, 'A', 'Established family office with conservative investment approach',
 'USER-002', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),

('CASE-202508-0004', 'Prospect', 'Low', 'initial_contact', DATE_ADD(NOW(), INTERVAL 21 DAY),
 'CUST-004', 'Innovation Partners LLP', 'Partnership', NULL, NULL,
 'TAX-SG-004', '71 Robinson Road', '#12-01', 'Singapore', 'Singapore',
 'TBD', 'Venture capital and startup incubation', 'Jennifer Ng',
 'jennifer@innovationpartners.sg', '+65 6789 3456', NULL, NULL, NULL,
 NULL, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),

('CASE-202508-0005', 'Rejected', 'High', 'terminated', DATE_SUB(NOW(), INTERVAL 5 DAY),
 'CUST-005', 'Offshore Investments Ltd', 'Foreign Govt. Organization', 'REG-2020-005', NULL,
 'TAX-XX-005', 'Unknown Address', NULL, 'Unknown', 'Unknown',
 'Unknown', 'Unclear business activities', 'Unknown',
 'contact@offshore.com', '+00 0000 0000', NULL, NULL, 'Failed enhanced due diligence',
 'USER-004', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),

('CASE-202508-0006', 'KYC Review', 'Medium', 'document_collection', DATE_ADD(NOW(), INTERVAL 10 DAY),
 'CUST-006', 'ABC Trading Company', 'Non-Listed Company', 'REG-2021-006', 'CIS-006',
 'TAX-SG-006', '50 Collyer Quay', '#05-07', 'Singapore', 'Singapore',
 'Active NFFE', 'Import/export trading', 'Robert Johnson',
 'robert@abctrading.sg', '+65 6789 5678', 3000000, 'BBB', 'Medium-sized trading firm with regional presence',
 'USER-002', false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 6: Related Parties (Link parties to cases)
-- =====================================================================

INSERT INTO csob_related_parties (party_id, relationship_type, ownership_percentage, case_id, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
-- Tech Innovations case
('PARTY-001', 'Director', NULL, 'CASE-202508-0001', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-002', 'Shareholder', 40.0, 'CASE-202508-0001', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-005', 'Shareholder', 35.0, 'CASE-202508-0001', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-006', 'Shareholder', 25.0, 'CASE-202508-0001', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Global Trust case
('PARTY-003', 'Trustee', NULL, 'CASE-202508-0002', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Chen Family Office case
('PARTY-002', 'Partner', 50.0, 'CASE-202508-0003', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-005', 'Partner', 50.0, 'CASE-202508-0003', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Innovation Partners case
('PARTY-004', 'Partner', 100.0, 'CASE-202508-0004', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- ABC Trading case
('PARTY-001', 'Director', NULL, 'CASE-202508-0006', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
('PARTY-006', 'Director', NULL, 'CASE-202508-0006', false, 'SYSTEM', NOW(), 'SYSTEM', NOW());
-- =====================================================================
-- SECTION 7: Documents with User Attribution
-- =====================================================================

-- Documents for CASE-202508-0001 (Tech Innovations)
INSERT INTO csob_documents (
    name, document_type, original_filename, mime_type, size_in_bytes,
    owner_type, owner_id, case_id, status, version,
    uploaded_by_user_id, verified_by_user_id, verified_date,
    expiry_date, comments, is_current_for_case, is_ad_hoc,
    is_deleted, created_by, created_date, last_modified_by, last_modified_date
) VALUES
-- Case documents
('ARCA / Questnet Search', 'ARCA / Questnet Search', 'acra_search_v1.pdf', 'application/pdf', 156789,
 'CASE', 'CASE-202508-0001', 'CASE-202508-0001', 'Verified', 1,
 'USER-002', 'USER-004', DATE_SUB(NOW(), INTERVAL 2 DAY),
 DATE_ADD(NOW(), INTERVAL 1 MONTH), 'Initial ACRA search completed', true, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 5 DAY), 'USER-004', DATE_SUB(NOW(), INTERVAL 2 DAY)),

('Certificate of Incorporation', 'Certificate of Incorporation', 'cert_incorp.pdf', 'application/pdf', 234567,
 'CASE', 'CASE-202508-0001', 'CASE-202508-0001', 'Submitted', 1,
 'USER-002', NULL, NULL,
 NULL, 'Awaiting verification', true, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 3 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Party documents for John Tan (PARTY-001)
('NRIC / Birth Certificate', 'NRIC / Birth Certificate', 'john_tan_nric.pdf', 'application/pdf', 123456,
 'PARTY', 'PARTY-001', NULL, 'Verified', 1,
 'USER-002', 'USER-003', DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_ADD(NOW(), INTERVAL 5 YEAR), 'NRIC verified against MyInfo', true, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 4 DAY), 'USER-003', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Documents for CASE-202508-0006 (ABC Trading)
('Master Credit Agreement', 'Master Credit Agreement', 'credit_agreement_v1.pdf', 'application/pdf', 456789,
 'CASE', 'CASE-202508-0006', 'CASE-202508-0006', 'Submitted', 1,
 'USER-002', NULL, NULL,
 DATE_ADD(NOW(), INTERVAL 1 YEAR), 'Credit facility agreement pending approval', true, false,
 false, 'USER-002', NOW(), 'USER-002', NOW()),

('Financial Statements', 'Financial Statements', 'financials_2024.pdf', 'application/pdf', 987654,
 'CASE', 'CASE-202508-0006', 'CASE-202508-0006', 'Submitted', 1,
 'USER-002', NULL, NULL,
 NULL, 'FY2024 audited financials', true, false,
 false, 'USER-002', NOW(), 'USER-002', NOW()),

-- Multiple versions example for Robert Johnson's passport
('Passport', 'Passport', 'robert_passport_v1.pdf', 'application/pdf', 234567,
 'PARTY', 'PARTY-006', NULL, 'Expired', 1,
 'USER-002', 'USER-004', DATE_SUB(NOW(), INTERVAL 10 DAY),
 DATE_SUB(NOW(), INTERVAL 1 DAY), 'Passport expired', false, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 15 DAY), 'USER-004', DATE_SUB(NOW(), INTERVAL 10 DAY)),

('Passport', 'Passport', 'robert_passport_v2.pdf', 'application/pdf', 245678,
 'PARTY', 'PARTY-006', NULL, 'Rejected', 2,
 'USER-002', 'USER-004', DATE_SUB(NOW(), INTERVAL 5 DAY),
 DATE_ADD(NOW(), INTERVAL 5 YEAR), 'Scan quality too poor', false, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 7 DAY), 'USER-004', DATE_SUB(NOW(), INTERVAL 5 DAY)),

('Passport', 'Passport', 'robert_passport_v3.pdf', 'application/pdf', 256789,
 'PARTY', 'PARTY-006', NULL, 'Submitted', 3,
 'USER-002', NULL, NULL,
 DATE_ADD(NOW(), INTERVAL 5 YEAR), 'New passport scan submitted', true, false,
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 1 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- =====================================================================
-- SECTION 8: Call Reports
-- =====================================================================

INSERT INTO call_reports (
    call_date, summary, next_steps, call_type, duration, outcome,
    case_id, is_deleted, created_by, created_date, last_modified_by, last_modified_date
) VALUES
(DATE_SUB(NOW(), INTERVAL 10 DAY), 
 'Initial meeting with John Tan to discuss account opening requirements', 
 'Client to provide remaining KYC documents within 5 business days',
 'Meeting', 60, 'Positive', 'CASE-202508-0001', false,
 'USER-002', DATE_SUB(NOW(), INTERVAL 10 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 10 DAY)),

(DATE_SUB(NOW(), INTERVAL 5 DAY),
 'Follow-up call regarding missing documents',
 'Reminded client about pending certificate of incorporation',
 'Outbound', 15, 'Neutral', 'CASE-202508-0001', false,
 'USER-002', DATE_SUB(NOW(), INTERVAL 5 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 5 DAY)),

(DATE_SUB(NOW(), INTERVAL 3 DAY),
 'Discussed trust structure and beneficiaries with Michael Lim',
 'Await trust deed and beneficiary details',
 'Meeting', 90, 'Positive', 'CASE-202508-0002', false,
 'USER-003', DATE_SUB(NOW(), INTERVAL 3 DAY), 'USER-003', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- =====================================================================
-- SECTION 9: Activity Logs
-- =====================================================================
INSERT INTO csob_activity_logs (
    type, details, case_id,
    is_deleted, created_by, created_date, last_modified_by, last_modified_date
) VALUES
('case_created', 'Case created for Tech Innovations Pte Ltd', 'CASE-202508-0001',
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 15 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 15 DAY)),

('document_uploaded', 'Uploaded document: ARCA / Questnet Search', 'CASE-202508-0001',
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 5 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 5 DAY)),

('document_verified', 'Verified document: ARCA / Questnet Search', 'CASE-202508-0001',
 false, 'USER-004', DATE_SUB(NOW(), INTERVAL 2 DAY), 'USER-004', DATE_SUB(NOW(), INTERVAL 2 DAY)),

('case_assigned', 'Case assigned to Sarah Chen', 'CASE-202508-0001',
 false, 'USER-003', DATE_SUB(NOW(), INTERVAL 14 DAY), 'USER-003', DATE_SUB(NOW(), INTERVAL 14 DAY)),

('party_added', 'Added related party: Robert Johnson as Shareholder', 'CASE-202508-0001',
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 12 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 12 DAY)),

('status_change', 'Status changed from Prospect to KYC Review', 'CASE-202508-0006',
 false, 'USER-002', DATE_SUB(NOW(), INTERVAL 1 DAY), 'USER-002', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- =====================================================================
-- SECTION 10: KYC Configuration
-- =====================================================================

INSERT INTO csob_kyc_configurations (config_key, config_value) VALUES
('sla_days_kyc_review', '14'),
('sla_days_pending_approval', '7'),
('sla_days_active', '365'),
('high_risk_countries', '["North Korea", "Iran", "Syria"]'),
('document_validity_passport_months', '60'),
('document_validity_nric_months', '120');

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Check user counts
SELECT 'Users' as Entity, COUNT(*) as Count FROM csob_users
UNION ALL
SELECT 'Cases', COUNT(*) FROM csob_cases
UNION ALL
SELECT 'Parties', COUNT(*) FROM csob_parties
UNION ALL
SELECT 'Documents', COUNT(*) FROM csob_documents
UNION ALL
SELECT 'Related Parties', COUNT(*) FROM csob_related_parties
UNION ALL
SELECT 'Call Reports', COUNT(*) FROM call_reports
UNION ALL
SELECT 'Activity Logs', COUNT(*) FROM csob_activity_logs;

-- Check document user attribution
SELECT 
    d.document_type,
    d.status,
    u1.name as uploaded_by,
    u2.name as verified_by,
    d.is_current_for_case
FROM csob_documents d
LEFT JOIN csob_users u1 ON d.uploaded_by_user_id = u1.user_id
LEFT JOIN csob_users u2 ON d.verified_by_user_id = u2.user_id
ORDER BY d.created_date DESC;

-- Re-enable checks
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- =====================================================================
-- END OF SEED SCRIPT
-- =====================================================================

-- =====================================================================
-- DOCUMENT REQUIREMENTS AND TEMPLATES SEED SCRIPT
-- =====================================================================
-- Add this section to your main seed script after the KYC Configuration section
-- =====================================================================

-- =====================================================================
-- SECTION 11: Template Categories
-- =====================================================================

INSERT INTO csob_template_categories (id, category_key, display_name, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'individualTemplates', 'Individual Document Templates', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'entityTemplates', 'Entity Document Templates', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'bankFormTemplates', 'Bank Form Templates', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'riskBasedDocuments', 'Risk-Based Document Templates', false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'entityRoleMapping', 'Entity Role Mappings', false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 12: Template Types
-- =====================================================================

-- Individual Templates
INSERT INTO csob_template_types (id, category_id, type_key, display_name, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
-- Individual document types by residency status
(1, 1, 'Singaporean/PR', 'Singaporean/PR Documents', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 1, 'Foreigner', 'Foreigner Documents', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Entity document types
(3, 2, 'Individual Account', 'Individual Account Documents', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 2, 'Joint Account', 'Joint Account Documents', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 2, 'Joint Account (Non-resident)', 'Joint Account (Non-resident) Documents', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 2, 'Non-Listed Company', 'Non-Listed Company Documents', 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 2, 'Listed Company', 'Listed Company Documents', 5, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(8, 2, 'Partnership', 'Partnership Documents', 6, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(9, 2, 'Sole Proprietorship', 'Sole Proprietorship Documents', 7, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 2, 'Trust Account', 'Trust Account Documents', 8, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(11, 2, 'Foundation', 'Foundation Documents', 9, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(12, 2, 'Societies/MCST', 'Societies/MCST Documents', 10, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(13, 2, 'Bank', 'Bank Documents', 11, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(14, 2, 'Non-Profit Organization', 'Non-Profit Organization Documents', 12, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(15, 2, 'Foreign Govt. Organization', 'Foreign Govt. Organization Documents', 13, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(16, 2, 'Local Regulated Company', 'Local Regulated Company Documents', 14, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(17, 2, 'Complex Corporation', 'Complex Corporation Documents', 15, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Risk-based document types
(18, 4, 'High', 'High Risk Documents', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 13: Document Requirements
-- =====================================================================

-- Requirements for Singaporean/PR individuals
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(1, 'Identity Document / NRIC / Birth Certificate', 'Valid NRIC or Birth Certificate for Singapore citizens/PR', true, 120, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(1, 'Proof of Residential Address', 'Utility bill or bank statement not older than 3 months', true, 3, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Foreigners
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(2, 'Passport', 'Valid passport with at least 6 months validity', true, 60, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'Proof of Residential Address', 'Utility bill or bank statement not older than 3 months', true, 3, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'Work Permit / Employment Pass', 'Valid work permit or employment pass for Singapore', true, NULL, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Non-Listed Companies
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(6, 'ARCA / Questnet Search', 'Latest ACRA business profile search', true, 1, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'Certificate of Incorporation', 'Company registration certificate', true, NULL, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'Memorandum & Articles of Association', 'Latest M&A of the company', true, NULL, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'Board Resolution for Account Opening', 'Board resolution authorizing account opening', true, 12, 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'List of Directors', 'Current list of all directors', true, 12, 5, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'List of Shareholders', 'Current list of all shareholders', true, 12, 6, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'Business Activities Confirmation', 'Detailed description of business activities', false, 12, 7, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Listed Companies
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(7, 'ARCA / Questnet Search', 'Latest ACRA business profile search', true, 1, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 'Certificate of Incorporation', 'Company registration certificate', true, NULL, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 'Annual Report', 'Latest annual report', true, 12, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 'Board Resolution for Account Opening', 'Board resolution authorizing account opening', true, 12, 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Partnerships
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(8, 'ARCA / Questnet Search', 'Latest ACRA business profile search', true, 1, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(8, 'Partnership Agreement', 'Partnership deed or agreement', true, NULL, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(8, 'List of Partners', 'Current list of all partners', true, 12, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Trust Accounts
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(10, 'Trust Deed', 'Original trust deed or certified copy', true, NULL, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 'Certificate of Registration', 'Trust registration certificate if applicable', false, NULL, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 'List of Trustees', 'Current list of all trustees', true, 12, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 'List of Beneficiaries', 'Current list of all beneficiaries', true, 12, 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 'Trust Resolution', 'Resolution for account opening', true, 12, 5, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- High Risk Additional Documents
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(18, 'Source of Funds Declaration', 'Detailed declaration of source of funds', true, 12, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(18, 'Enhanced Business Profile', 'Detailed business profile with transaction patterns', true, 12, 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(18, 'Bank References', 'Reference letters from existing banks', false, 6, 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- Requirements for Individual/Joint Accounts
INSERT INTO csob_document_requirements (template_type_id, name, description, required, validity_months, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
(3, 'Salary Slip', 'Latest salary slip or income proof', false, 3, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'Joint Account Agreement', 'Agreement between joint account holders', true, NULL, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(5, 'Joint Account Agreement', 'Agreement between joint account holders', true, NULL, 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 14: Bank Forms
-- =====================================================================

INSERT INTO csob_bank_forms (id, category, form_name, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
-- Corporate Mandatory Forms
(1, 'corporateMandatory', 'Account Opening Form', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'corporateMandatory', 'Signature Card', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'corporateMandatory', 'Terms and Conditions', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'corporateMandatory', 'FATCA Declaration', 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Corporate Optional Forms
(5, 'corporateOptional', 'Internet Banking Application', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'corporateOptional', 'Cheque Book Request', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 'corporateOptional', 'Corporate Card Application', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Individual Stakeholder Forms
(8, 'individualStakeholder', 'Personal Guarantee Form', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(9, 'individualStakeholder', 'Individual KYC Form', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(10, 'individualStakeholder', 'Beneficial Owner Declaration', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- SECTION 15: Entity Role Mappings
-- =====================================================================

INSERT INTO csob_entity_roles (id, entity_type, role_name, display_order, is_deleted, created_by, created_date, last_modified_by, last_modified_date) VALUES
-- Non-Listed Company roles
(1, 'Non-Listed Company', 'Director', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(2, 'Non-Listed Company', 'Shareholder', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(3, 'Non-Listed Company', 'Authorized Signatory', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(4, 'Non-Listed Company', 'Beneficial Owner', 4, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Listed Company roles
(5, 'Listed Company', 'Director', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(6, 'Listed Company', 'Major Shareholder', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(7, 'Listed Company', 'Authorized Signatory', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Partnership roles
(8, 'Partnership', 'Partner', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(9, 'Partnership', 'Managing Partner', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Trust Account roles
(10, 'Trust Account', 'Trustee', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(11, 'Trust Account', 'Beneficiary', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(12, 'Trust Account', 'Settlor', 3, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Individual/Joint Account roles
(13, 'Individual Account', 'Account Holder', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(14, 'Joint Account', 'Joint Account Holder', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(15, 'Joint Account (Non-resident)', 'Joint Account Holder', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
-- Other entity types
(16, 'Sole Proprietorship', 'Sole Proprietor', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(17, 'Foundation', 'Council Member', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(18, 'Foundation', 'Founder', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(19, 'Societies/MCST', 'Committee Member', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(20, 'Societies/MCST', 'Chairman', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(21, 'Bank', 'Director', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(22, 'Non-Profit Organization', 'Board Member', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(23, 'Foreign Govt. Organization', 'Representative', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(24, 'Local Regulated Company', 'Director', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(25, 'Complex Corporation', 'Director', 1, false, 'SYSTEM', NOW(), 'SYSTEM', NOW()),
(26, 'Complex Corporation', 'Ultimate Beneficial Owner', 2, false, 'SYSTEM', NOW(), 'SYSTEM', NOW());

-- =====================================================================
-- VERIFICATION QUERIES FOR TEMPLATES
-- =====================================================================

-- Check template counts
SELECT 'Template Categories' as Entity, COUNT(*) as Count FROM csob_template_categories WHERE is_deleted = false
UNION ALL
SELECT 'Template Types', COUNT(*) FROM csob_template_types WHERE is_deleted = false
UNION ALL
SELECT 'Document Requirements', COUNT(*) FROM csob_document_requirements WHERE is_deleted = false
UNION ALL
SELECT 'Bank Forms', COUNT(*) FROM csob_bank_forms WHERE is_deleted = false
UNION ALL
SELECT 'Entity Roles', COUNT(*) FROM csob_entity_roles WHERE is_deleted = false;

-- Show document requirements by entity type
SELECT 
    tc.display_name as category,
    tt.display_name as type,
    COUNT(dr.id) as requirement_count
FROM csob_template_categories tc
JOIN csob_template_types tt ON tc.id = tt.category_id
LEFT JOIN csob_document_requirements dr ON tt.id = dr.template_type_id AND dr.is_deleted = false
WHERE tc.is_deleted = false AND tt.is_deleted = false
GROUP BY tc.id, tt.id
ORDER BY tc.id, tt.display_order;