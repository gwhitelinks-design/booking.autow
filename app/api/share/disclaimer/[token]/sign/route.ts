import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendDisclaimerEmails } from '@/lib/autow-email';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const body = await request.json();
    const { customer_email, customer_signature } = body;

    if (!customer_email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!customer_signature) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Check if disclaimer exists and is pending
      const checkResult = await client.query(
        'SELECT * FROM disclaimers WHERE share_token = $1',
        [token]
      );

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Disclaimer not found' }, { status: 404 });
      }

      const disclaimer = checkResult.rows[0];

      if (disclaimer.status === 'signed') {
        return NextResponse.json({ error: 'Disclaimer has already been signed' }, { status: 400 });
      }

      // Update the disclaimer with signature
      const now = new Date().toISOString();
      const updateResult = await client.query(
        `UPDATE disclaimers
         SET customer_email = $1,
             customer_signature = $2,
             signature_date = $3,
             signed_at = $3,
             status = 'signed'
         WHERE share_token = $4
         RETURNING *`,
        [customer_email.trim(), customer_signature, now, token]
      );

      const signedDisclaimer = updateResult.rows[0];

      // Send emails to both staff and customer
      try {
        await sendDisclaimerEmails({
          disclaimerNumber: signedDisclaimer.disclaimer_number,
          procedureDescription: signedDisclaimer.procedure_description,
          includeExistingPartsDisclaimer: signedDisclaimer.include_existing_parts_disclaimer,
          includeDiagnosticPaymentDisclaimer: signedDisclaimer.include_diagnostic_payment_disclaimer,
          customerEmail: signedDisclaimer.customer_email,
          signedAt: signedDisclaimer.signed_at,
        });
      } catch (emailError) {
        console.error('Error sending disclaimer emails:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Disclaimer signed successfully',
        disclaimer: signedDisclaimer,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error signing disclaimer:', error);
    return NextResponse.json({ error: 'Failed to sign disclaimer' }, { status: 500 });
  }
}
