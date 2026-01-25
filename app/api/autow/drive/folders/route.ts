import { NextRequest, NextResponse } from 'next/server';
import { listInvoiceFolders, ensureExpensesFolder } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== process.env.AUTOW_STAFF_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoice folders
    const invoiceFolders = await listInvoiceFolders();

    // Get the expenses folder ID
    const expensesFolderId = await ensureExpensesFolder();

    return NextResponse.json({
      invoiceFolders,
      expensesFolder: {
        id: expensesFolderId,
        name: 'General Expenses',
      },
    });

  } catch (error: any) {
    console.error('Error listing drive folders:', error);
    return NextResponse.json(
      { error: 'Failed to list folders', details: error.message },
      { status: 500 }
    );
  }
}
