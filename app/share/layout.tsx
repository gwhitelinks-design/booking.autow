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
        url: 'https://booking.autow-services.co.uk/latest2.png',
        width: 800,
        height: 800,
        alt: 'AUTOW Services Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOW Services - Your Document',
    description: 'View your estimate or invoice from AUTOW Services',
    images: ['https://booking.autow-services.co.uk/latest2.png'],
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
