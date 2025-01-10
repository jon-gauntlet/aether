import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const mediaRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        size: z.number(),
        courseId: z.string().optional(),
        lessonId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.prisma.mediaAttachment.create({
        data: input,
      })
      return attachment
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // TODO: Add cloud storage deletion logic
      await ctx.prisma.mediaAttachment.delete({
        where: { id: input },
      })
      return { success: true }
    }),

  listByCourse: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const attachments = await ctx.prisma.mediaAttachment.findMany({
        where: { courseId: input },
      })
      return attachments
    }),

  listByLesson: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const attachments = await ctx.prisma.mediaAttachment.findMany({
        where: { lessonId: input },
      })
      return attachments
    }),
}) 