import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { deleteReceiptImage as deleteFromSupabase } from '@/lib/supabase-storage';
import { deleteFile as deleteFromGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, deleteFromStorage = true } = body;

    if (!id) {
      return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
    }

    // Get the receipt first to get storage paths
    const receiptResult = await pool.query(
      'SELECT * FROM receipts WHERE id = $1',
      [id]
    );

    if (receiptResult.rows.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const receipt = receiptResult.rows[0];
    const deletionResults = {
      supabase: false,
      googleDrive: false,
    };

    if (deleteFromStorage) {
      // Delete from Supabase Storage if path exists
      if (receipt.supabase_file_path) {
        try {
          await deleteFromSupabase(receipt.supabase_file_path);
          deletionResults.supabase = true;
          console.log('Deleted from Supabase Storage:', receipt.supabase_file_path);
        } catch (supabaseError: any) {
          console.error('Failed to delete from Supabase Storage:', supabaseError);
        }
      }

      // Delete from Google Drive if file ID exists
      if (receipt.gdrive_file_id) {
        try {
          await deleteFromGoogleDrive(receipt.gdrive_file_id);
          deletionResults.googleDrive = true;
          console.log('Deleted from Google Drive:', receipt.gdrive_file_id);
        } catch (driveError: any) {
          console.error('Failed to delete from Google Drive:', driveError);
        }
      }
    }

    // Delete from database
    await pool.query('DELETE FROM receipts WHERE id = $1', [id]);

    return NextResponse.json({
      message: 'Receipt deleted successfully',
      deletionResults,
    });

  } catch (error: any) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete receipt', details: error.message },
      { status: 500 }
    );
  }
}
