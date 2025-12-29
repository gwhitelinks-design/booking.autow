'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function EditInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/autow/invoices/create?id=${id}`);
    } else {
      router.replace('/autow/invoices');
    }
  }, [id, router]);

  return null;
}
