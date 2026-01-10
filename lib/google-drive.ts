import { google, drive_v3 } from 'googleapis';

// Initialize the Google Drive client with service account credentials
function getDriveClient(): drive_v3.Drive {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Debug logging for Vercel
  console.log('Google Drive config check:', {
    hasClientEmail: !!clientEmail,
    clientEmailLength: clientEmail?.length || 0,
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length || 0,
    privateKeyStart: privateKey?.substring(0, 27) || 'missing',
  });

  if (!clientEmail || !privateKey) {
    throw new Error(`Google Drive credentials not configured. clientEmail: ${!!clientEmail}, privateKey: ${!!privateKey}`);
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

// Upload a receipt image to the appropriate monthly folder
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
