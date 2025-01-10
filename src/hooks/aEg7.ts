import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const mediaRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        type: z.enum(["image", "video", "document", "other"]),
        title: z.string(),
        description: z.string().optional(),
        size: z.number(),
        courseId: z.string().optional(),
        lessonId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.prisma.mediaAttachment.create({
        data: {
          url: input.url,
          type: input.type,
          title: input.title,
          description: input.description,
          size: input.size,
          courseId: input.courseId,
          lessonId: input.lessonId,
          uploadedById: ctx.session.user.id,
        },
      })
      return media
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.prisma.mediaAttachment.delete({
        where: { id },
      })
      return true
    }),

  listByCourse: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: courseId }) => {
      const media = await ctx.prisma.mediaAttachment.findMany({
        where: { courseId },
        include: {
          uploadedBy: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return media
    }),

  listByLesson: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: lessonId }) => {
      const media = await ctx.prisma.mediaAttachment.findMany({
        where: { lessonId },
        include: {
          uploadedBy: true,
        },
        orderBy: { createdAt: "desc" },
      })
      return media
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.prisma.mediaAttachment.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
        },
      })
      return media
    }),
}) 