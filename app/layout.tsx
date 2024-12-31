// app/layout.tsx
import type { Metadata } from "next"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/providers"
import { SessionProvider } from "@/components/auth/SessionProvider"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Stock Portfolio Tracker",
  description: "Track and manage your stock portfolio",
}

export default function RootLayout({ children }) {
  return (
    <html className={geistSans.variable}>
      <body>
        <ThemeProvider>
          <SessionProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}