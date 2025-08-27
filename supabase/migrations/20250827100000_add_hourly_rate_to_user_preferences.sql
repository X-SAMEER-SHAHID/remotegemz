-- Add hourly_rate to user_preferences and backfill
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) DEFAULT 50.00;

-- Backfill nulls to default 50.00
UPDATE user_preferences SET hourly_rate = 50.00 WHERE hourly_rate IS NULL;

-- Ensure RLS already exists from previous migration; no new policies needed


