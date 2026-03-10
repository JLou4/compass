import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Compass - Agent API Review Engine',
  description: 'Review and monitor agent APIs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/" className="text-xl font-bold hover:text-gray-200">🧭 Compass</Link>
                <p className="text-gray-300 text-sm">Agent API Review Engine</p>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/" className="hover:text-gray-200">Dashboard</Link>
                <Link href="/services" className="hover:text-gray-200">Services</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  )
}