import { initTRPC } from '@trpc/server'
import { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware

// Auth middleware
const isAuthed = middleware(async ({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new Error('Not authenticated')
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed) 