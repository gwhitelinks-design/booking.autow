import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Helper to get Drive client for folder deletion
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

// Delete a folder and all its contents
async function deleteFolder(folderId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({
    fileId: folderId,
    supportsAllDrives: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // First, get the invoice to check status
    const invoiceQuery = await pool.query(
      `SELECT id, status FROM invoices WHERE id = $1`,
      [id]
    );

    if (invoiceQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceQuery.rows[0];

    if (invoice.status !== 'paid') {
      return NextResponse.json({ error: 'Invoice is not marked as paid' }, { status: 400 });
    }

    // Try to get Google Drive folder ID if column exists
    let driveDeleted = false;
    try {
      const driveQuery = await pool.query(
        `SELECT gdrive_folder_id FROM invoices WHERE id = $1`,
        [id]
      );
      const gdriveFolderId = driveQuery.rows[0]?.gdrive_folder_id;

      if (gdriveFolderId) {
        try {
          await deleteFolder(gdriveFolderId);
          driveDeleted = true;
          console.log('Deleted Google Drive folder:', gdriveFolderId);
        } catch (driveError: any) {
          console.error('Error deleting Google Drive folder:', driveError);
          // Continue anyway - folder might have been manually deleted
        }
      }
    } catch (columnError) {
      // gdrive_folder_id column doesn't exist yet - skip Drive deletion
      console.log('gdrive_folder_id column not found, skipping Drive deletion');
    }

    // Mark invoice as unpaid and clear payment fields
    // Use dynamic SQL to handle columns that may not exist
    let updateQuery = `
      UPDATE invoices
      SET status = 'pending',
          payment_method = NULL,
          payment_reference = NULL,
          payment_date = NULL,
          paid_at = NULL,
          amount_paid = 0,
          balance_due = total
      WHERE id = $1
      RETURNING *`;

    // Try to also clear gdrive columns if they exist
    try {
      const result = await pool.query(
        `UPDATE invoices
         SET status = 'pending',
             payment_method = NULL,
             payment_reference = NULL,
             payment_date = NULL,
             paid_at = NULL,
             amount_paid = 0,
             balance_due = total,
             gdrive_folder_id = NULL,
             gdrive_folder_name = NULL,
             gdrive_pdf_id = NULL,
             gdrive_pdf_url = NULL
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return NextResponse.json({
        message: 'Invoice marked as unpaid successfully',
        invoice: result.rows[0],
        driveDeleted,
      });
    } catch (updateError: any) {
      // If gdrive columns don't exist, use simpler update
      if (updateError.message?.includes('column') || updateError.code === '42703') {
        const result = await pool.query(updateQuery, [id]);
        return NextResponse.json({
          message: 'Invoice marked as unpaid successfully',
          invoice: result.rows[0],
          driveDeleted,
        });
      }
      throw updateError;
    }

  } catch (error: any) {
    console.error('Error marking invoice as unpaid:', error);
    return NextResponse.json({ error: 'Failed to mark invoice as unpaid', details: error.message }, { status: 500 });
  }
}
