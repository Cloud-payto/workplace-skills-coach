import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workplace Skills Coach',
  description: 'Practice and improve your professional communication and problem-solving skills',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
