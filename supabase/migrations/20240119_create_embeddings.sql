-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the embeddings table
CREATE TABLE IF NOT EXISTS embeddings (
    id bigserial PRIMARY KEY,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(3072) NOT NULL,  -- text-embedding-3-large dimensions
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_embeddings_updated_at
    BEFORE UPDATE ON embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function for similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(3072),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        embeddings.id,
        embeddings.content,
        embeddings.metadata,
        1 - (embeddings.embedding <=> query_embedding) AS similarity
    FROM embeddings
    WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 