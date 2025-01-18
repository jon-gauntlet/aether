const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  },
}

export default config 