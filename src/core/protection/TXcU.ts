import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

export const moduleRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const module = await ctx.prisma.module.create({
        data: {
          courseId: input.courseId,
          title: input.title,
          description: input.description,
          order: input.order,
        },
      })
      return module
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const module = await ctx.prisma.module.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
        },
      })
      return module
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.module.delete({
        where: { id: input },
      })
      return true
    }),

  byId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const module = await ctx.prisma.module.findUnique({
        where: { id: input },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
          course: true,
        },
      })
      return module
    }),

  byCourse: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const modules = await ctx.prisma.module.findMany({
        where: { courseId: input },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      })
      return modules
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
        ctx.prisma.module.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
      await ctx.prisma.$transaction(updates)
      return true
    }),
}) 