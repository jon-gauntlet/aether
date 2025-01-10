import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const lessonRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        title: z.string(),
        content: z.string(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.create({
        data: {
          moduleId: input.moduleId,
          title: input.title,
          content: input.content,
          order: input.order,
        },
      })
      return lesson
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
        },
      })
      return lesson
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.lesson.delete({
        where: { id: input },
      })
      return true
    }),

  byId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.prisma.lesson.findUnique({
        where: { id: input },
        include: {
          module: true,
        },
      })
      return lesson
    }),

  byModule: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const lessons = await ctx.prisma.lesson.findMany({
        where: { moduleId: input },
        orderBy: { order: "asc" },
      })
      return lessons
    }),

  reorder: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          order: z.number(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.map((item) =>
        ctx.prisma.lesson.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
      await ctx.prisma.$transaction(updates)
      return true
    }),
}) 