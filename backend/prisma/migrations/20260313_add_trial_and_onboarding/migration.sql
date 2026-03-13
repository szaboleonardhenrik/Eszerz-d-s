-- Add trial and onboarding fields to users table
ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Set existing users as onboarding completed (they don't need the wizard)
UPDATE users SET onboarding_completed = true;
