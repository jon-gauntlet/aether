import express from 'express'
import { getMessages, sendMessage, onNewMessage } from '../lib/supabaseClient'
import { logger } from '../lib/logger'

const router = express.Router()

// Get messages with optional pagination
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const before = req.query.before
    const messages = await getMessages(limit, before)
    res.json(messages)
  } catch (error) {
    logger.error('Failed to get messages', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    const message = await sendMessage(content, req.user?.id)
    res.status(201).json(message)
  } catch (error) {
    logger.error('Failed to send message', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Subscribe to messages (WebSocket upgrade)
router.ws('/subscribe', (ws, req) => {
  let subscription

  try {
    subscription = onNewMessage((payload) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(payload))
      }
    })

    ws.on('close', () => {
      if (subscription) {
        subscription.unsubscribe()
        logger.info('Client unsubscribed from messages')
      }
    })

    ws.on('error', (error) => {
      logger.error('WebSocket error', error)
      if (subscription) {
        subscription.unsubscribe()
      }
    })

  } catch (error) {
    logger.error('Failed to setup message subscription', error)
    ws.close()
  }
})

export default router 