import { google, drive_v3 } from 'googleapis';

// Initialize the Google Drive client with service account credentials
function getDriveClient(): drive_v3.Drive {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in environment variables.');
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

// Get the root folder ID from environment
function getRootFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured in environment variables.');
  }
  return folderId;
}

// Find a folder by name within a parent folder
export async function findFolderByName(
  parentId: string,
  folderName: string
): Promise<string | null> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = response.data.files;
  if (files && files.length > 0) {
    return files[0].id || null;
  }
  return null;
}

// Create a new folder within a parent folder
export async function createFolder(
  parentId: string,
  folderName: string
): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  if (!response.data.id) {
    throw new Error('Failed to create folder in Google Drive');
  }

  return response.data.id;
}

// Ensure a monthly folder exists (find or create)
// folderName format: 'YYYY-MM' (e.g., '2026-01')
export async function ensureMonthlyFolder(folderName: string): Promise<string> {
  const rootFolderId = getRootFolderId();

  // First, try to find existing folder
  const existingFolderId = await findFolderByName(rootFolderId, folderName);
  if (existingFolderId) {
    return existingFolderId;
  }

  // Create new folder if it doesn't exist
  return await createFolder(rootFolderId, folderName);
}

// Upload a file to a specific folder
export async function uploadFile(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getDriveClient();

  // Create a readable stream from buffer
  const { Readable } = require('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  if (!response.data.id) {
    throw new Error('Failed to upload file to Google Drive');
  }

  // Make the file viewable by anyone with the link
  try {
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
  } catch (permError) {
    // Permission creation might fail on shared drives with restricted settings
    console.warn('Could not set public permissions:', permError);
  }

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
  };
}

// Delete a file by ID
export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

// Ensure the Invoices parent folder exists
export async function ensureInvoicesFolder(): Promise<string> {
  const rootFolderId = getRootFolderId();
  const folderName = 'Invoices';

  const existingFolderId = await findFolderByName(rootFolderId, folderName);
  if (existingFolderId) {
    return existingFolderId;
  }

  return await createFolder(rootFolderId, folderName);
}

// Ensure the Expenses folder exists
export async function ensureExpensesFolder(): Promise<string> {
  const rootFolderId = getRootFolderId();
  const folderName = 'Expenses';

  const existingFolderId = await findFolderByName(rootFolderId, folderName);
  if (existingFolderId) {
    return existingFolderId;
  }

  return await createFolder(rootFolderId, folderName);
}

// Create an invoice folder with format INV-{VehicleReg}-{Date} or INV-{ClientName}-{Date}
export async function createInvoiceFolder(
  vehicleReg: string | null,
  clientName: string,
  invoiceDate: string,
  invoiceNumber: string
): Promise<{ folderId: string; folderName: string }> {
  const invoicesParentId = await ensureInvoicesFolder();

  // Clean up the identifier (vehicle reg or client name)
  const identifier = vehicleReg
    ? vehicleReg.replace(/\s+/g, '').toUpperCase()
    : clientName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

  // Format: INV-AB12CDE-2026-01-15 or INV-JohnSmith-2026-01-15
  const folderName = `INV-${identifier}-${invoiceDate}`;

  // Check if folder already exists
  const existingFolderId = await findFolderByName(invoicesParentId, folderName);
  if (existingFolderId) {
    return { folderId: existingFolderId, folderName };
  }

  const folderId = await createFolder(invoicesParentId, folderName);
  return { folderId, folderName };
}

// List all invoice folders for dropdown selection
export async function listInvoiceFolders(): Promise<Array<{ id: string; name: string }>> {
  const drive = getDriveClient();
  const invoicesParentId = await ensureInvoicesFolder();

  const response = await drive.files.list({
    q: `'${invoicesParentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name desc',
    pageSize: 100,
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const folders = response.data.files || [];
  return folders.map(f => ({ id: f.id!, name: f.name! }));
}

// Check if a file with similar name exists in folder (for duplicate detection)
export async function checkDuplicateFile(
  folderId: string,
  fileNamePattern: string
): Promise<{ exists: boolean; existingFile?: { id: string; name: string } }> {
  const drive = getDriveClient();

  // Search for files matching the pattern in the folder
  const response = await drive.files.list({
    q: `'${folderId}' in parents and name contains '${fileNamePattern}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = response.data.files;
  if (files && files.length > 0) {
    return { exists: true, existingFile: { id: files[0].id!, name: files[0].name! } };
  }
  return { exists: false };
}

// Upload a receipt image to a specific folder (invoice folder or expenses folder)
export async function uploadReceiptToFolder(
  base64Data: string,
  supplier: string,
  folderId: string
): Promise<{ fileId: string; webViewLink: string }> {
  // Extract the actual base64 data (remove data:image/...;base64, prefix if present)
  let base64Content = base64Data;
  let mimeType = 'image/jpeg';

  if (base64Data.includes(';base64,')) {
    const parts = base64Data.split(';base64,');
    const mimeMatch = parts[0].match(/data:(.+)/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    base64Content = parts[1];
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64');

  // Generate filename: RECEIPT_YYYYMMDD_HHMMSS_supplier.ext
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').substring(0, 15);
  const sanitizedSupplier = supplier.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const extension = mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `RECEIPT_${timestamp}_${sanitizedSupplier}.${extension}`;

  // Check for duplicate (same supplier on same day)
  const datePrefix = timestamp.substring(0, 8); // YYYYMMDD
  const duplicateCheck = await checkDuplicateFile(folderId, `RECEIPT_${datePrefix}`);
  if (duplicateCheck.exists && duplicateCheck.existingFile?.name.includes(sanitizedSupplier)) {
    throw new Error(`Duplicate detected: A receipt from "${supplier}" was already uploaded today to this folder (${duplicateCheck.existingFile.name})`);
  }

  // Upload the file
  return await uploadFile(folderId, fileName, mimeType, buffer);
}

// Upload invoice PDF to folder
export async function uploadInvoicePdf(
  folderId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  const fileName = `Invoice-${invoiceNumber}.pdf`;

  // Check for duplicate invoice PDF
  const duplicateCheck = await checkDuplicateFile(folderId, `Invoice-${invoiceNumber}`);
  if (duplicateCheck.exists) {
    throw new Error(`Duplicate detected: Invoice PDF "${duplicateCheck.existingFile?.name}" already exists in this folder`);
  }

  return await uploadFile(folderId, fileName, 'application/pdf', pdfBuffer);
}

// Upload a receipt image to the appropriate monthly folder (legacy - kept for backwards compatibility)
export async function uploadReceiptImage(
  base64Data: string,
  supplier: string,
  receiptDate: string
): Promise<{ fileId: string; webViewLink: string; folderPath: string }> {
  // Extract month folder name from date (YYYY-MM)
  const monthFolder = receiptDate.substring(0, 7);

  // Ensure monthly folder exists
  const folderId = await ensureMonthlyFolder(monthFolder);

  // Extract the actual base64 data (remove data:image/...;base64, prefix if present)
  let base64Content = base64Data;
  let mimeType = 'image/jpeg';

  if (base64Data.includes(';base64,')) {
    const parts = base64Data.split(';base64,');
    const mimeMatch = parts[0].match(/data:(.+)/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    base64Content = parts[1];
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64');

  // Generate filename: RECEIPT_YYYYMMDD_HHMMSS_supplier.ext
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').substring(0, 15);
  const sanitizedSupplier = supplier.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const extension = mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `RECEIPT_${timestamp}_${sanitizedSupplier}.${extension}`;

  // Upload the file
  const result = await uploadFile(folderId, fileName, mimeType, buffer);

  return {
    ...result,
    folderPath: monthFolder,
  };
}
