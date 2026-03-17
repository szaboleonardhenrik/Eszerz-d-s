-- Clause Library
CREATE TABLE clauses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  team_id TEXT,
  user_id TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clauses_user ON clauses(user_id);
CREATE INDEX idx_clauses_category ON clauses(category);

-- Portal Invitations
CREATE TABLE portal_invitations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  team_id TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_invitations_email ON portal_invitations(email);
CREATE INDEX idx_portal_invitations_token ON portal_invitations(token);
