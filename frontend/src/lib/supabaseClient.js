export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      if (email === 'test@example.com' && password === 'password') {
        return { data: { user: { id: 1, email } }, error: null }
      }
      return { data: null, error: { message: 'Invalid credentials' } }
    },
    signOut: async () => {
      return { error: null }
    },
    getSession: async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        return { data: { session: { access_token: token } }, error: null }
      }
      return { data: { session: null }, error: null }
    },
    onAuthStateChange: (callback) => {
      // Mock subscription
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  },
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        if (file.size > 5000000) {
          return { error: { message: 'File too large' } }
        }
        return { data: { path }, error: null }
      },
      download: async (path) => {
        return { data: new Blob(['test']), error: null }
      },
      remove: async (path) => {
        return { error: null }
      },
      list: async () => {
        return { data: [{ name: 'test.txt' }], error: null }
      }
    })
  }
} 