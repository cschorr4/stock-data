import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/profile')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <Link href="/" className="absolute left-8 top-8">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-card px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <AuthDialog />
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-card px-6 text-muted-foreground">
                    New to the platform?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/signup" className="text-sm font-semibold leading-6">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}