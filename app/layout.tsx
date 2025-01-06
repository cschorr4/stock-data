import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auto-provider';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from '@/components/providers/session-provider';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Stock Portfolio Tracker',
  description: 'Track your investments and portfolio performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <SessionProvider />
          <RouteGuard>
            {children}
          </RouteGuard>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}