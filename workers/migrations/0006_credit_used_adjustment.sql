-- Allow admins to adjust the effective "AI credits used" count.
-- Effective used = COUNT(*) FROM ai_usage + credit_used_adj.
-- Positive adj → more used (fewer available). Negative → fewer used (more available / credits returned).
ALTER TABLE users ADD COLUMN credit_used_adj INTEGER NOT NULL DEFAULT 0;
