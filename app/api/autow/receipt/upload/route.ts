import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadReceiptImage as uploadToSupabase, getMonthlyFolderPath } from '@/lib/supabase-storage';
import { uploadReceiptImage as uploadToGoogleDrive } from '@/lib/google-drive';

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
      created_by = 'Staff'
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

    // Storage results
    let supabaseResult: { url: string; path: string } | null = null;
    let driveResult: { fileId: string; webViewLink: string; folderPath: string } | null = null;
    const errors: string[] = [];

    // 1. Upload to Supabase Storage (primary/reliable)
    try {
      supabaseResult = await uploadToSupabase(imageData, supplier);
      console.log('Supabase Storage upload successful:', supabaseResult.url);
    } catch (supabaseError: any) {
      console.error('Supabase Storage upload failed:', supabaseError);
      errors.push(`Supabase: ${supabaseError.message}`);
    }

    // 2. Upload to Google Drive (secondary)
    try {
      driveResult = await uploadToGoogleDrive(imageData, supplier, finalReceiptDate);
      console.log('Google Drive upload successful:', driveResult.webViewLink);
    } catch (driveError: any) {
      console.error('Google Drive upload failed:', driveError);
      errors.push(`Google Drive: ${driveError.message}`);
    }

    // Check if at least one storage succeeded
    if (!supabaseResult && !driveResult) {
      return NextResponse.json(
        { error: 'Failed to upload to any storage', details: errors.join('; ') },
        { status: 500 }
      );
    }

    // Generate receipt number using database function
    const numberResult = await pool.query('SELECT generate_receipt_number() as receipt_number');
    const receipt_number = numberResult.rows[0].receipt_number;

    // Insert receipt record with both storage URLs
    const result = await pool.query(
      `INSERT INTO receipts (
        receipt_number, receipt_date, supplier, description, amount, category,
        gdrive_file_id, gdrive_file_url, gdrive_folder_path,
        supabase_file_path, supabase_file_url,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12
      ) RETURNING *`,
      [
        receipt_number,
        finalReceiptDate,
        supplier,
        description || null,
        amount,
        category || null,
        driveResult?.fileId || null,
        driveResult?.webViewLink || null,
        driveResult?.folderPath || getMonthlyFolderPath(),
        supabaseResult?.path || null,
        supabaseResult?.url || null,
        created_by
      ]
    );

    // Build response with storage status
    const storageStatus = {
      supabase: supabaseResult ? 'success' : 'failed',
      googleDrive: driveResult ? 'success' : 'failed',
    };

    return NextResponse.json({
      message: 'Receipt uploaded successfully',
      receipt: result.rows[0],
      storageStatus,
      warnings: errors.length > 0 ? errors : undefined,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: 'Failed to upload receipt', details: error.message },
      { status: 500 }
    );
  }
}
