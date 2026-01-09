import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'receipts';

// Lazy-initialize Supabase client to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

/**
 * Generate a unique filename for a receipt image
 */
export function generateReceiptFilename(supplier: string, originalFilename?: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const sanitizedSupplier = supplier.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const extension = originalFilename?.split('.').pop() || 'jpg';
  return `RECEIPT_${timestamp}_${sanitizedSupplier}.${extension}`;
}

/**
 * Get the monthly folder path (e.g., '2026-01')
 */
export function getMonthlyFolderPath(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Upload a receipt image to Supabase Storage
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param supplier - Supplier name for filename
 * @param originalFilename - Original filename (optional)
 * @returns Object with file URL and path
 */
export async function uploadReceiptImage(
  base64Data: string,
  supplier: string,
  originalFilename?: string
): Promise<{ url: string; path: string }> {
  // Remove data URL prefix if present
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64');

  // Generate filename and path
  const filename = generateReceiptFilename(supplier, originalFilename);
  const folderPath = getMonthlyFolderPath();
  const fullPath = `${folderPath}/${filename}`;

  // Determine content type
  let contentType = 'image/jpeg';
  if (base64Data.includes('data:image/png')) {
    contentType = 'image/png';
  } else if (base64Data.includes('data:image/webp')) {
    contentType = 'image/webp';
  }

  // Upload to Supabase Storage
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fullPath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload failed:', error);
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fullPath);

  return {
    url: urlData.publicUrl,
    path: fullPath,
  };
}

/**
 * Delete a receipt image from Supabase Storage
 * @param path - The file path in storage (e.g., '2026-01/RECEIPT_20260109_123456_Shell.jpg')
 */
export async function deleteReceiptImage(path: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Supabase Storage delete failed:', error);
    throw new Error(`Failed to delete from Supabase Storage: ${error.message}`);
  }
}

/**
 * List all receipt images in a specific month folder
 * @param monthPath - The month folder path (e.g., '2026-01')
 */
export async function listReceiptImages(monthPath: string): Promise<{ name: string; url: string }[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(monthPath, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Supabase Storage list failed:', error);
    throw new Error(`Failed to list from Supabase Storage: ${error.message}`);
  }

  return (data || []).map((file) => {
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${monthPath}/${file.name}`);

    return {
      name: file.name,
      url: urlData.publicUrl,
    };
  });
}
