import { router } from '../trpc'
import { userRouter } from './user'
import { courseRouter } from './course'
import { moduleRouter } from './module'
import { lessonRouter } from './lesson'
import { enrollmentRouter } from './enrollment'
import { mediaRouter } from './media'
import { notificationRouter } from './notification'
import { analyticsRouter } from './analytics'
import { collaborationRouter } from './collaboration'

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  module: moduleRouter,
  lesson: lessonRouter,
  enrollment: enrollmentRouter,
  media: mediaRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  collaboration: collaborationRouter,
})

export type AppRouter = typeof appRouter 