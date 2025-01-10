import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
})

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`
    )

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }

    const response = NextResponse.next()

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', reset.toString())

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 