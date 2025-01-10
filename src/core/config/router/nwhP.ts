import { router } from '../trpc'
import { userRouter } from './user'
import { courseRouter } from './course'
import { mediaRouter } from './media'
import { notificationRouter } from './notification'
import { analyticsRouter } from './analytics'
import { collaborationRouter } from './collaboration'

export const appRouter = router({
  user: userRouter,
  course: courseRouter,
  media: mediaRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  collaboration: collaborationRouter,
})

export type AppRouter = typeof appRouter 