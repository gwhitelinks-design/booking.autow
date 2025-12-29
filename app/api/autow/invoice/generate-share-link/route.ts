import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = verifyToken(token);
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { invoice_id } = await request.json();

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if invoice exists and belongs to user
      const invoiceResult = await client.query(
        'SELECT id, user_id, share_token FROM invoices WHERE id = $1',
        [invoice_id]
      );

      if (invoiceResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.user_id !== userData.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Generate or return existing share token
      let shareToken = invoice.share_token;

      if (!shareToken) {
        // Generate new token
        shareToken = await client.query('SELECT generate_share_token() as token');
        shareToken = shareToken.rows[0].token;

        // Update invoice with share token
        await client.query(
          'UPDATE invoices SET share_token = $1, share_token_created_at = CURRENT_TIMESTAMP WHERE id = $2',
          [shareToken, invoice_id]
        );
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/invoice/${shareToken}`;

      return NextResponse.json({
        success: true,
        share_token: shareToken,
        share_url: shareUrl
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 });
  }
}
