import { beforeAll, afterAll } from 'vitest'
import { supabase } from './supabaseClient'
import { testUtils } from './test-utils'
import { logger } from './logger'
import { checkEnvironment } from './env-checker'

// Silence console in tests unless explicitly needed
beforeAll(() => {
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
  console.warn = () => {}
  // Keep error logging
})

// Clean database before all tests
beforeAll(async () => {
  try {
    checkEnvironment()
    await testUtils.clearMessages()
    logger.debug('Test environment initialized')
  } catch (error) {
    logger.error('Failed to initialize test environment', error)
    throw error
  }
})

// Cleanup after all tests
afterAll(async () => {
  try {
    await testUtils.clearMessages()
    const { error } = await supabase.removeAllChannels()
    if (error) throw error
    logger.debug('Test environment cleaned up')
  } catch (error) {
    logger.error('Failed to cleanup test environment', error)
    throw error
  }
}) 