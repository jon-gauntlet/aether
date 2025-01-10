import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'
import { getSession } from 'next-auth/react'

export type SocketEvent = {
  type: 'collaboration' | 'notification' | 'analytics'
  action: string
  payload: any
}

let io: SocketIOServer | null = null

export const initializeWebSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    path: '/api/ws',
    addTrailingSlash: false,
  })

  io.use(async (socket, next) => {
    const session = await getSession({ req: socket.request })
    if (!session) {
      next(new Error('Unauthorized'))
      return
    }
    socket.data.session = session
    next()
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-lesson', async (lessonId: string) => {
      socket.join(`lesson:${lessonId}`)
      const session = await getSession({ req: socket.request })
      if (session?.user?.id) {
        await prisma.userCollaboration.updateMany({
          where: {
            userId: session.user.id,
            session: {
              lessonId,
              active: true,
            },
          },
          data: {
            status: 'active',
          },
        })
      }
    })

    socket.on('leave-lesson', async (lessonId: string) => {
      socket.leave(`lesson:${lessonId}`)
      const session = await getSession({ req: socket.request })
      if (session?.user?.id) {
        await prisma.userCollaboration.updateMany({
          where: {
            userId: session.user.id,
            session: {
              lessonId,
              active: true,
            },
          },
          data: {
            status: 'disconnected',
          },
        })
      }
    })

    socket.on('chat-message', async (data: { sessionId: string; content: string }) => {
      const session = await getSession({ req: socket.request })
      if (!session?.user?.id) return

      const message = await prisma.chatMessage.create({
        data: {
          content: data.content,
          userId: session.user.id,
          sessionId: data.sessionId,
        },
        include: {
          user: true,
        },
      })

      io?.to(`lesson:${data.sessionId}`).emit('chat-message', message)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

export const emitEvent = (event: SocketEvent, room?: string) => {
  const socket = getIO()
  if (room) {
    socket.to(room).emit(event.type, event)
  } else {
    socket.emit(event.type, event)
  }
} 