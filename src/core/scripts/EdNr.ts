import { router } from '../trpc'
import { userRouter } from './user'
import { courseRouter } from './course'

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
})

export type AppRouter = typeof appRouter 