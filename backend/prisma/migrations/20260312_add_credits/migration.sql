-- Add credit system for pay-per-use contract sending/timestamps
ALTER TABLE users ADD COLUMN send_credits INT NOT NULL DEFAULT 0;

-- Credit transaction log
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  balance INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);

-- Give existing paid users some starting credits based on tier
UPDATE users SET send_credits = 2 WHERE subscription_tier = 'free';
UPDATE users SET send_credits = 15 WHERE subscription_tier = 'starter';
UPDATE users SET send_credits = 50 WHERE subscription_tier = 'medium';
UPDATE users SET send_credits = 150 WHERE subscription_tier = 'premium';
UPDATE users SET send_credits = 500 WHERE subscription_tier = 'enterprise';

-- Grant permissions
GRANT ALL ON TABLE credit_transactions TO legitas;
