import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState(null)
  const { login, loading, error: authError } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    
    if (!email || !password) {
      setLocalError('Email and password are required')
      return
    }

    try {
      const { error } = await login({ email, password })
      if (error) {
        setLocalError(error)
      }
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const errorMessage = localError || authError

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Welcome to Aether Chat</h1>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {errorMessage && (
            <div className="error" role="alert">
              {errorMessage}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              data-testid="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !email || !password}
            data-testid="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
} 