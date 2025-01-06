'use client';

import { useAuth } from '@/components/providers/auto-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/reset-password'];

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Check if it's a public route
      if (publicRoutes.includes(pathname)) {
        // If user is logged in and tries to access public route, redirect to home
        if (user) {
          router.push('/');
        }
      } else {
        // If user is not logged in and tries to access protected route, redirect to login
        if (!user) {
          router.push('/login');
        }
      }
    }
  }, [user, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For public routes, render if user is not logged in
  if (publicRoutes.includes(pathname)) {
    return !user ? children : null;
  }

  // For protected routes, render if user is logged in
  return user ? children : null;
}