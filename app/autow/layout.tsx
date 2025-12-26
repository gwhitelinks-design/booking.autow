import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AUTOW Booking System',
  description: 'Staff booking management system for AUTOW Services',
};

export default function AutowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
