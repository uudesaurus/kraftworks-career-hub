-- =============================================
-- Update Employer Clerk IDs
-- =============================================
-- After creating the 3 employer accounts in Clerk dashboard,
-- replace the placeholder IDs below with real Clerk user IDs.
--
-- Usage:
--   cd workers && npx wrangler d1 execute kraftworks-db --remote --file=update_clerk_ids.sql
-- =============================================

-- Enterprise Electrical
-- Replace 'user_XXXXX' with the real Clerk ID for hr@enterpriseelectrical.com
UPDATE users SET id = 'user_XXXXX' WHERE id = 'employer_enterprise_001';
UPDATE user_roles SET user_id = 'user_XXXXX' WHERE user_id = 'employer_enterprise_001';
UPDATE companies SET user_id = 'user_XXXXX' WHERE user_id = 'employer_enterprise_001';
UPDATE job_listings SET posted_by = 'user_XXXXX' WHERE posted_by = 'employer_enterprise_001';

-- Unify Energy Solutions
-- Replace 'user_YYYYY' with the real Clerk ID for careers@unifyenergy.com
UPDATE users SET id = 'user_YYYYY' WHERE id = 'employer_unify_001';
UPDATE user_roles SET user_id = 'user_YYYYY' WHERE user_id = 'employer_unify_001';
UPDATE companies SET user_id = 'user_YYYYY' WHERE user_id = 'employer_unify_001';
UPDATE job_listings SET posted_by = 'user_YYYYY' WHERE posted_by = 'employer_unify_001';

-- Hays Electrical Services
-- Replace 'user_ZZZZZ' with the real Clerk ID for hr@hayselectrical.com
UPDATE users SET id = 'user_ZZZZZ' WHERE id = 'employer_hays_001';
UPDATE user_roles SET user_id = 'user_ZZZZZ' WHERE user_id = 'employer_hays_001';
UPDATE companies SET user_id = 'user_ZZZZZ' WHERE user_id = 'employer_hays_001';
UPDATE job_listings SET posted_by = 'user_ZZZZZ' WHERE posted_by = 'employer_hays_001';
