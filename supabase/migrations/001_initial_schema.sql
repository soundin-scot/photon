-- Photon Coordination Layer — Initial Schema

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE instances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  universe_count SMALLINT DEFAULT 4,
  last_seen_at   TIMESTAMPTZ,
  relay_token    TEXT UNIQUE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE instance_permissions (
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'operator',
  PRIMARY KEY (instance_id, user_id)
);

CREATE TABLE showfiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS enabled but all access via service-role key only
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instance_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE showfiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_instances_owner ON instances(owner_id);
CREATE INDEX idx_instances_slug ON instances(slug);
CREATE INDEX idx_instance_permissions_user ON instance_permissions(user_id);
CREATE INDEX idx_showfiles_instance ON showfiles(instance_id);
