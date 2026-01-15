import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';
import { createInvoiceFolder, uploadInvoicePdf } from '@/lib/google-drive';
import { generateInvoicePdf } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, payment_method, payment_reference, amount_paid } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // First, get the invoice details we need
    const invoiceQuery = await pool.query(
      `SELECT id, invoice_number, invoice_date, client_name, vehicle_reg, share_token
       FROM invoices WHERE id = $1`,
      [id]
    );

    if (invoiceQuery.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceQuery.rows[0];

    // Generate share token if not exists
    let shareToken = invoice.share_token;
    if (!shareToken) {
      shareToken = randomUUID();
      await pool.query(
        'UPDATE invoices SET share_token = $1 WHERE id = $2',
        [shareToken, id]
      );
    }

    // Mark as paid first
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'paid',
           payment_method = $1,
           payment_reference = $2,
           payment_date = CURRENT_DATE,
           paid_at = NOW(),
           amount_paid = COALESCE($3, total),
           balance_due = 0
       WHERE id = $4
       RETURNING *`,
      [payment_method, payment_reference, amount_paid, id]
    );

    // Now create Google Drive folder and upload PDF
    let driveResult = null;
    try {
      // Create the invoice folder
      const invoiceDate = invoice.invoice_date instanceof Date
        ? invoice.invoice_date.toISOString().split('T')[0]
        : invoice.invoice_date;

      const { folderId, folderName } = await createInvoiceFolder(
        invoice.vehicle_reg,
        invoice.client_name,
        invoiceDate,
        invoice.invoice_number
      );

      // Generate PDF from share link
      const pdfBuffer = await generateInvoicePdf(shareToken);

      // Upload PDF to folder
      const uploadResult = await uploadInvoicePdf(
        folderId,
        invoice.invoice_number,
        pdfBuffer
      );

      // Update invoice with Google Drive info
      await pool.query(
        `UPDATE invoices
         SET gdrive_folder_id = $1,
             gdrive_folder_name = $2,
             gdrive_pdf_id = $3,
             gdrive_pdf_url = $4
         WHERE id = $5`,
        [folderId, folderName, uploadResult.fileId, uploadResult.webViewLink, id]
      );

      driveResult = {
        folderId,
        folderName,
        pdfFileId: uploadResult.fileId,
        pdfUrl: uploadResult.webViewLink,
      };

    } catch (driveError: any) {
      // Log the error but don't fail the whole operation
      console.error('Error uploading to Google Drive:', driveError);
      // The invoice is still marked as paid, just Drive upload failed
    }

    return NextResponse.json({
      message: 'Invoice marked as paid successfully',
      invoice: result.rows[0],
      drive: driveResult,
    });

  } catch (error: any) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json({ error: 'Failed to mark invoice as paid', details: error.message }, { status: 500 });
  }
}
