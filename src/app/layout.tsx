import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import NavigationProgressBar from '@/components/NavigationProgressBar';

export const metadata: Metadata = {
  title: 'Origins Atlas — Communities • Homes • Property Intelligence',
  description:
    'Origins Atlas is a community-first real estate intelligence platform starting in Thailand. One physical house, one canonical record — connecting every broker listing, asking price, and price history in one place.',
  keywords: [
    'Origins Atlas',
    'Thailand Real Estate',
    'Nirvana Absolute Bangna',
    'Bangkok Property Intelligence',
    'Canonical Property Records',
    'Bangna Luxury Homes',
  ],
  icons: {
    icon: '/brand/app-icon-dark.png',
    shortcut: '/brand/app-icon-dark.png',
    apple: '/brand/app-icon-dark.png',
  },
  openGraph: {
    title: 'Origins Atlas — Communities • Homes • Property Intelligence',
    description: 'One physical house, one canonical record. Every listing, agent, and historical price in one place.',
    type: 'website',
    images: [
      {
        url: '/brand/logo-luxury-dark.png',
        width: 1200,
        height: 630,
        alt: 'Origins Atlas',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/app-icon-dark.png" type="image/png" />
      </head>
      <body>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
