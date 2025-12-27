import type React from "react"
import type { Metadata } from "next"
import { Nunito_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Glassdoor | Job Search & Career Community",
  description:
    "Search millions of jobs and get the inside scoop on companies with employee reviews, personalized salary tools, and more.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
