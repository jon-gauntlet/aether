import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const collaborationRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        type: z.enum(["discussion", "group-work", "peer-review"]),
        title: z.string(),
        description: z.string().optional(),
        maxParticipants: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.collaborationSession.create({
        data: {
          lessonId: input.lessonId,
          type: input.type,
          title: input.title,
          description: input.description,
          maxParticipants: input.maxParticipants,
          createdById: ctx.session.user.id,
          active: true,
        },
        include: {
          createdBy: true,
        },
      })

      // Add creator as first participant
      await ctx.prisma.userCollaboration.create({
        data: {
          userId: ctx.session.user.id,
          sessionId: session.id,
          role: "host",
          status: "active",
        },
      })

      return session
    }),

  join: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: sessionId }) => {
      const session = await ctx.prisma.collaborationSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
        },
      })

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaboration session not found",
        })
      }

      if (!session.active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session is no longer active",
        })
      }

      if (
        session.maxParticipants &&
        session.participants.length >= session.maxParticipants
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session is full",
        })
      }

      const participation = await ctx.prisma.userCollaboration.create({
        data: {
          userId: ctx.session.user.id,
          sessionId,
          role: "participant",
          status: "active",
        },
        include: {
          user: true,
          session: true,
        },
      })

      return participation
    }),

  leave: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: sessionId }) => {
      await ctx.prisma.userCollaboration.update({
        where: {
          userId_sessionId: {
            userId: ctx.session.user.id,
            sessionId,
          },
        },
        data: {
          status: "left",
          leftAt: new Date(),
        },
      })
      return true
    }),

  end: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: sessionId }) => {
      const session = await ctx.prisma.collaborationSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collaboration session not found",
        })
      }

      if (session.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the session host can end the session",
        })
      }

      await ctx.prisma.$transaction([
        // Update all active participants to left
        ctx.prisma.userCollaboration.updateMany({
          where: {
            sessionId,
            status: "active",
          },
          data: {
            status: "left",
            leftAt: new Date(),
          },
        }),
        // Mark session as inactive
        ctx.prisma.collaborationSession.update({
          where: { id: sessionId },
          data: {
            active: false,
            endedAt: new Date(),
          },
        }),
      ])

      return true
    }),

  getActiveParticipants: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: sessionId }) => {
      const participants = await ctx.prisma.userCollaboration.findMany({
        where: {
          sessionId,
          status: "active",
        },
        include: {
          user: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
      })
      return participants
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
          sessionId: input.sessionId,
          userId: ctx.session.user.id,
        },
        include: {
          user: true,
        },
      })
      return message
    }),

  getMessages: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: sessionId }) => {
      const messages = await ctx.prisma.chatMessage.findMany({
        where: { sessionId },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      })
      return messages
    }),

  getActiveSessions: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: lessonId }) => {
      const sessions = await ctx.prisma.collaborationSession.findMany({
        where: {
          lessonId,
          active: true,
        },
        include: {
          createdBy: true,
          participants: {
            where: {
              status: "active",
            },
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      return sessions
    }),
}) 