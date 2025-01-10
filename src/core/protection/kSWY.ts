import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const collaborationRouter = router({
  createSession: protectedProcedure
    .input(z.string()) // lessonId
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.collaborationSession.create({
        data: {
          lessonId: input,
          participants: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      })
      return session
    }),

  joinSession: protectedProcedure
    .input(z.string()) // sessionId
    .mutation(async ({ ctx, input }) => {
      const participation = await ctx.prisma.userCollaboration.create({
        data: {
          userId: ctx.session.user.id,
          sessionId: input,
        },
        include: {
          session: {
            include: {
              participants: {
                include: {
                  user: true,
                },
              },
              messages: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },
      })
      return participation
    }),

  leaveSession: protectedProcedure
    .input(z.string()) // sessionId
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userCollaboration.delete({
        where: {
          userId_sessionId: {
            userId: ctx.session.user.id,
            sessionId: input,
          },
        },
      })
      return { success: true }
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.chatMessage.create({
        data: {
          content: input.content,
          userId: ctx.session.user.id,
          sessionId: input.sessionId,
        },
        include: {
          user: true,
        },
      })
      return message
    }),

  getSessionMessages: protectedProcedure
    .input(z.string()) // sessionId
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { sessionId: input },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
      return messages
    }),

  getActiveSessions: protectedProcedure
    .input(z.string()) // lessonId
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.prisma.collaborationSession.findMany({
        where: {
          lessonId: input,
          active: true,
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      })
      return sessions
    }),

  updateParticipantStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const participation = await ctx.prisma.userCollaboration.update({
        where: {
          userId_sessionId: {
            userId: ctx.session.user.id,
            sessionId: input.sessionId,
          },
        },
        data: {
          status: input.status,
        },
      })
      return participation
    }),
}) 