import { router } from '../trpc'
import { userRouter } from './user'
import { courseRouter } from './course'
import { moduleRouter } from './module'
import { lessonRouter } from './lesson'
import { enrollmentRouter } from './enrollment'

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  module: moduleRouter,
  lesson: lessonRouter,
  enrollment: enrollmentRouter,
})

export type AppRouter = typeof appRouter 