import { Button } from '@/components/ui/button'
import { getProviders, signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SignIn() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  const providers = await getProviders()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name} className="flex justify-center">
                <Button
                  onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                  className="w-full"
                >
                  Sign in with {provider.name}
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
} 