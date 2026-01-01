import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AUTOW Services - Document',
  description: 'View your estimate or invoice from AUTOW Services - Professional automotive services in Cornwall.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'AUTOW Services',
    title: 'AUTOW Services - Document',
    description: 'View your estimate or invoice from AUTOW Services',
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
    title: 'AUTOW Services - Document',
    description: 'View your estimate or invoice from AUTOW Services',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
