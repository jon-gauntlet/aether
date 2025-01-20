import { vi } from 'vitest'

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(async ({ email, password }) => {
      if (email === 'test@example.com' && password === 'password') {
        return {
          data: {
            user: { email: 'test@example.com' },
            session: { access_token: 'test-token' }
          },
          error: null
        }
      }
      return {
        data: null,
        error: { message: 'Invalid credentials' }
      }
    }),
    signOut: vi.fn(async () => {
      return { error: null }
    }),
    getSession: vi.fn(async () => {
      return {
        data: {
          session: null
        },
        error: null
      }
    }),
    onAuthStateChange: vi.fn((callback) => {
      callback('SIGNED_IN', {
        user: { email: 'test@example.com' },
        session: { access_token: 'test-token' }
      })
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  }
}

export default mockSupabase 