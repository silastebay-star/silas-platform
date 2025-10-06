-- migrations/003_ai_documents.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  area_code text,
  title text,
  content text,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

-- Fast equality / text search index
CREATE INDEX IF NOT EXISTS ai_documents_title_idx ON ai_documents USING gin (to_tsvector('english', coalesce(title,'')));

-- pgvector index (ivfflat is good for medium datasets)
CREATE INDEX IF NOT EXISTS ai_documents_embedding_idx ON ai_documents USING ivfflat (embedding) WITH (lists = 100);

-- Example RLS: allow SELECT only to community members (assumes memberships table exists)
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_documents ON ai_documents
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.community_id = ai_documents.community_id
      )
      OR ai_documents.community_id IS NULL
    )
  );