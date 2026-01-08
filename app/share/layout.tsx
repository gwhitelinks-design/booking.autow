import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AUTOW Services - Document',
  description: 'View your estimate or invoice from AUTOW Services - Professional automotive services in Cornwall.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'AUTOW Services',
    title: 'AUTOW Services - Your Document',
    description: 'View your estimate or invoice from AUTOW Services - Professional mobile mechanic services in Cornwall.',
    images: [
      {
        url: 'https://autow-services.co.uk/logo.png',
        width: 512,
        height: 512,
        alt: 'AUTOW Services Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'AUTOW Services - Your Document',
    description: 'View your estimate or invoice from AUTOW Services',
    images: ['https://autow-services.co.uk/logo.png'],
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
