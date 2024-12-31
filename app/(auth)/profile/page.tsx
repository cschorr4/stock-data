import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { UserProfileForm } from '@/components/settings/UserProfileForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const handleSignOut = async () => {
    'use server'
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <form action={handleSignOut}>
          <Button variant="ghost" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>

      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold leading-7">Account Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your account settings and profile information
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Profile Information */}
              <div className="space-y-6">
                <UserProfileForm />
              </div>

              {/* Account Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {session.user.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Account Created</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {new Date(session.user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Last Updated</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {profile?.updated_at
                          ? new Date(profile.updated_at).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        // Implement account deletion logic
                      }}
                    >
                      Delete Account
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}