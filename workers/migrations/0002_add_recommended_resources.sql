-- Add recommended_resources column to interview_questions table
ALTER TABLE interview_questions ADD COLUMN recommended_resources TEXT DEFAULT '[]';
