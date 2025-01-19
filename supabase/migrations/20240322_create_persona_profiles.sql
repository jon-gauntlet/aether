-- Create persona profiles table
CREATE TABLE IF NOT EXISTS persona_profiles (
    user_id TEXT PRIMARY KEY,
    communication_style JSONB NOT NULL,
    tone_preferences JSONB NOT NULL,
    common_phrases TEXT[] NOT NULL,
    average_response_length INTEGER NOT NULL,
    active_hours JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE persona_profiles ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON persona_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to manage their own profiles
CREATE POLICY "Allow users to manage their own profiles"
ON persona_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_persona_profiles_updated_at
    BEFORE UPDATE ON persona_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 