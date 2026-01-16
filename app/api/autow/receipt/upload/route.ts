import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadReceiptToFolder, ensureExpensesFolder } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      imageData,
      supplier,
      description,
      amount,
      receipt_date,
      category,
      folderId,
      created_by = 'Staff',
      invoice_id
    } = body;

    // Validate required fields
    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier is required' }, { status: 400 });
    }
    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const finalReceiptDate = receipt_date || new Date().toISOString().slice(0, 10);

    // Determine target folder - if no folderId provided, use Expenses folder
    let targetFolderId = folderId;
    let folderName = 'Selected Folder';

    if (!targetFolderId) {
      // Default to Expenses folder if no folder selected
      targetFolderId = await ensureExpensesFolder();
      folderName = 'General Expenses';
    }

    // Upload image to Google Drive
    let driveResult: { fileId: string; webViewLink: string };

    try {
      driveResult = await uploadReceiptToFolder(imageData, supplier, targetFolderId);
      console.log('Google Drive upload successful:', driveResult.webViewLink);
    } catch (driveError: any) {
      console.error('Google Drive upload failed:', driveError);
      return NextResponse.json(
        { error: 'Failed to upload image to Google Drive', details: driveError.message },
        { status: 500 }
      );
    }

    // Generate receipt number using database function
    const numberResult = await pool.query('SELECT generate_receipt_number() as receipt_number');
    const receipt_number = numberResult.rows[0].receipt_number;

    // Insert receipt METADATA into database (image stored in Google Drive only)
    // Note: Using gdrive_folder_path to store folder ID for backwards compatibility
    const result = await pool.query(
      `INSERT INTO receipts (
        receipt_number, receipt_date, supplier, description, amount, category,
        gdrive_file_id, gdrive_file_url, gdrive_folder_path,
        status, created_by, invoice_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11
      ) RETURNING *`,
      [
        receipt_number,
        finalReceiptDate,
        supplier,
        description || null,
        amount,
        category || null,
        driveResult.fileId,
        driveResult.webViewLink,
        targetFolderId,
        created_by,
        invoice_id || null
      ]
    );

    return NextResponse.json({
      message: 'Receipt uploaded successfully',
      receipt: result.rows[0],
      storage: 'Google Drive (image) + Supabase Database (metadata only)',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: 'Failed to upload receipt', details: error.message },
      { status: 500 }
    );
  }
}
