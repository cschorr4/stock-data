'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileForm } from '@/components/settings/UserProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UserInfo } from '@/components/auth/UserInfo';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <UserInfo />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfileForm />
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Account Created</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {new Date(user.created_at!).toLocaleDateString()}
                </div>
              </div>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Implement account deletion
                    }}
                  >
                    Delete Account
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}