import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from '@/components/providers/SessionProvider';
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
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}