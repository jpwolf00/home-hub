import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastContext'
import { ToastContainer } from '@/components/ui/Toast'
import { NightModeProvider } from '@/components/ui/NightModeProvider'
import ClientLayout from '@/components/ui/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Home Hub',
  description: 'Your personal home dashboard',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NightModeProvider>
          <ClientLayout>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </ClientLayout>
        </NightModeProvider>
      </body>
    </html>
  )
}
