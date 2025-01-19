-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    sender VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    start_idx INTEGER NOT NULL,
    end_idx INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Document Storage', false)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies
CREATE POLICY "Documents are accessible by authenticated users only"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
    AND (OCTET_LENGTH(file) <= 52428800)  -- 50MB in bytes
    AND (
        LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN (
            'pdf', 'txt', 'md', 'json'
        )
    )
);

CREATE POLICY "Users can only delete their own documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    upload_count INTEGER;
BEGIN
    -- Count uploads in the last minute for this user
    SELECT COUNT(*)
    INTO upload_count
    FROM storage.objects
    WHERE auth.uid()::text = (storage.foldername(name))[1]
    AND created_at > NOW() - INTERVAL '1 minute';

    IF upload_count >= 10 THEN
        RAISE EXCEPTION 'Upload rate limit exceeded';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting
CREATE TRIGGER enforce_upload_rate_limit
    BEFORE INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION check_upload_rate_limit(); 