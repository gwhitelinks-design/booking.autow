import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Enable safe-area-inset for notched devices
};

export const metadata: Metadata = {
  title: 'AUTOW Services',
  description: 'Professional mobile mechanic and automotive services in Cornwall. Mobile repairs, garage services, vehicle recovery, and ECU remapping.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AUTOW',
  },
  keywords: 'mobile mechanic, auto repair, vehicle recovery, ECU remapping, Cornwall, Penzance',
  authors: [{ name: 'AUTOW Services' }],
  creator: 'AUTOW Services',
  publisher: 'AUTOW Services',
  formatDetection: {
    telephone: false, // Prevent iOS auto-linking phone numbers
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: 'AUTOW Services',
    title: 'AUTOW Services - Professional Automotive Services',
    description: 'Professional mobile mechanic and automotive services in Cornwall. Mobile repairs, garage services, vehicle recovery, and ECU remapping.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AUTOW Services Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOW Services',
    description: 'Professional mobile mechanic and automotive services in Cornwall.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
