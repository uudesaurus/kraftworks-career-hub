-- Migration: Add internal_notes to job_listings and admin_notes to companies
-- Run with: npx wrangler d1 execute kraftworks-db --remote --file=migrations/add-notes-columns.sql

ALTER TABLE job_listings ADD COLUMN internal_notes TEXT DEFAULT NULL;
ALTER TABLE companies ADD COLUMN admin_notes TEXT DEFAULT NULL;
