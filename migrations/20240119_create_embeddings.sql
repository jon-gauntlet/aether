-- Create embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(3072) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an IVFFlat index for fast similarity search with high dimensions
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add RLS policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read embeddings
CREATE POLICY "Allow authenticated users to read embeddings"
ON embeddings FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert embeddings
CREATE POLICY "Allow authenticated users to insert embeddings"
ON embeddings FOR INSERT
TO authenticated
WITH CHECK (true); 