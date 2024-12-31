import type { Metadata } from "next"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/providers"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SessionProvider } from "@/components/auth/SessionProvider"
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

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider />
        {children}
      </body>
    </html>
  )
}