-- Seed admin account for admin@kraftworks.com
-- After creating the user in the Clerk dashboard, replace ADMIN_CLERK_USER_ID with the actual Clerk user ID
-- and run: wrangler d1 execute kraftworks-db --remote --file=./migrations/seed_admin_manual.sql
--
-- This migration is intentionally a no-op. Admin seeding must be done manually
-- after the Clerk user is created and the webhook populates the users table.
-- See README for instructions.

SELECT 1; -- no-op placeholder
