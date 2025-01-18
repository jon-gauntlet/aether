import { logger } from './logger'

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

export function checkEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(
    varName => !import.meta.env[varName]
  )

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    logger.error(error)
    throw new Error(error)
  }

  logger.debug('Environment variables verified')
  return true
} 