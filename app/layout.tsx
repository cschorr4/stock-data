import type { Metadata } from "next"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/providers"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { AuthProvider } from "@/components/auth/AuthProvider"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Stock Portfolio Tracker",
  description: "Track and manage your stock portfolio",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}