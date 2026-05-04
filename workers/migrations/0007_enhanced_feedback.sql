-- Enhanced resume feedback: add score breakdown and motivation note
ALTER TABLE resume_feedback ADD COLUMN score_breakdown TEXT DEFAULT NULL;  -- JSON: {formatting, content, trade_relevance, impact}
ALTER TABLE resume_feedback ADD COLUMN motivation_note TEXT DEFAULT NULL;  -- Personalized encouragement
