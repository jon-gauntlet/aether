-- Add supporting indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS embeddings_metadata_idx ON embeddings USING GIN (metadata);
CREATE INDEX IF NOT EXISTS embeddings_created_at_idx ON embeddings (created_at DESC);

-- Analyze the table to update statistics
ANALYZE embeddings;

-- Add function for exact k-NN search (no index, but more accurate)
CREATE OR REPLACE FUNCTION knn_match_embeddings(
    query_embedding vector(3072),
    k integer
)
RETURNS TABLE (
    id bigint,
    content text,
    metadata jsonb,
    similarity float,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        embeddings.id,
        embeddings.content,
        embeddings.metadata,
        1 - (embeddings.embedding <=> query_embedding) AS similarity,
        embeddings.created_at
    FROM embeddings
    ORDER BY embeddings.embedding <=> query_embedding
    LIMIT k;
END;
$$;

COMMENT ON FUNCTION knn_match_embeddings IS 
'Exact k-NN search function optimized for high-dimensional vectors (3072d).
Does not use an index but provides exact results.
k: number of nearest neighbors to return'; 