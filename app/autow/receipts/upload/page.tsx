'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const styles = {
  container: {
    backgroundColor: '#000',
    color: '#fff',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
  } as React.CSSProperties,
  logo: {
    height: '50px',
    width: 'auto',
  } as React.CSSProperties,
  backButton: {
    backgroundColor: 'transparent',
    color: '#30ff37',
    border: '1px solid #30ff37',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#30ff37',
  } as React.CSSProperties,
  section: {
    marginBottom: '30px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '15px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  } as React.CSSProperties,
  imageSection: {
    border: '2px dashed #333',
    borderRadius: '10px',
    padding: '30px',
    textAlign: 'center' as const,
    marginBottom: '30px',
  } as React.CSSProperties,
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '10px',
    marginBottom: '15px',
  } as React.CSSProperties,
  buttonRow: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  captureButton: {
    backgroundColor: '#30ff37',
    color: '#000',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  uploadButton: {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '15px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  clearButton: {
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  rescanButton: {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as React.CSSProperties,
  label: {
    fontSize: '14px',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  required: {
    color: '#ff4444',
  } as React.CSSProperties,
  autoFillBadge: {
    backgroundColor: 'rgba(48, 255, 55, 0.2)',
    color: '#30ff37',
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
  } as React.CSSProperties,
  input: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px',
    color: '#fff',
    fontSize: '16px',
  } as React.CSSProperties,
  inputAutoFilled: {
    backgroundColor: '#111',
    border: '1px solid rgba(48, 255, 55, 0.4)',
    borderRadius: '8px',
    padding: '15px',
    color: '#fff',
    fontSize: '16px',
  } as React.CSSProperties,
  select: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  } as React.CSSProperties,
  textarea: {
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px',
    color: '#fff',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical' as const,
  } as React.CSSProperties,
  amountGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  currencySymbol: {
    fontSize: '20px',
    color: '#30ff37',
    fontWeight: 'bold',
  } as React.CSSProperties,
  submitButton: {
    backgroundColor: '#30ff37',
    color: '#000',
    border: 'none',
    padding: '18px 40px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '20px',
  } as React.CSSProperties,
  submitButtonDisabled: {
    backgroundColor: '#333',
    color: '#666',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  error: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    color: '#ff4444',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,
  success: {
    backgroundColor: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid #30ff37',
    color: '#30ff37',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  } as React.CSSProperties,
  hiddenInput: {
    display: 'none',
  } as React.CSSProperties,
  loadingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #333',
    borderTop: '4px solid #30ff37',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  loadingText: {
    marginTop: '20px',
    color: '#30ff37',
    fontSize: '18px',
  } as React.CSSProperties,
  loadingSubtext: {
    marginTop: '10px',
    color: '#666',
    fontSize: '14px',
  } as React.CSSProperties,
  confidenceBanner: {
    backgroundColor: 'rgba(48, 255, 55, 0.1)',
    border: '1px solid rgba(48, 255, 55, 0.3)',
    borderRadius: '10px',
    padding: '15px 20px',
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '10px',
  } as React.CSSProperties,
  confidenceText: {
    color: '#30ff37',
    fontSize: '14px',
  } as React.CSSProperties,
  confidenceScore: {
    backgroundColor: '#30ff37',
    color: '#000',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  manualEntryNote: {
    color: '#aaa',
    fontSize: '12px',
    fontStyle: 'italic',
  } as React.CSSProperties,
};

export default function ReceiptUploadPage() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageData, setImageData] = useState<string | null>(null);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState<{ invoiceFolders: Array<{ id: string; name: string }>; expensesFolder: { id: string; name: string } | null }>({
    invoiceFolders: [],
    expensesFolder: null,
  });
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');
  const [invoices, setInvoices] = useState<Array<{ id: number; invoice_number: string; client_name: string; vehicle_reg: string; total: number }>>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('autow_token');
    if (!token) {
      router.push('/autow');
    }
  }, [router]);

  // Fetch Google Drive folders for dropdown
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const token = localStorage.getItem('autow_token');
        const response = await fetch('/api/autow/drive/folders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFolders(data);
        }
      } catch (err) {
        console.error('Error fetching folders:', err);
      } finally {
        setLoadingFolders(false);
      }
    };
    fetchFolders();
  }, []);

  // Fetch invoices for job costing link
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('autow_token');
        const response = await fetch('/api/autow/invoice/list?status=paid', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }
    };
    fetchInvoices();
  }, []);

  const parseReceipt = async (imgData: string) => {
    setScanning(true);
    setError(null);

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/receipt/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ imageData: imgData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan receipt');
      }

      if (data.success && data.data) {
        const extracted = data.data;
        const filledFields = new Set<string>();

        // Auto-fill form fields
        if (extracted.supplier) {
          setSupplier(extracted.supplier);
          filledFields.add('supplier');
        }
        if (extracted.amount !== null && extracted.amount !== undefined) {
          setAmount(extracted.amount.toString());
          filledFields.add('amount');
        }
        if (extracted.date) {
          setReceiptDate(extracted.date);
          filledFields.add('date');
        }
        if (extracted.category) {
          setCategory(extracted.category);
          filledFields.add('category');
        }
        if (extracted.description) {
          setDescription(extracted.description);
          filledFields.add('description');
        }

        setAutoFilledFields(filledFields);
        setConfidence(extracted.confidence);
        setScanned(true);
      }
    } catch (err: any) {
      console.error('Receipt scan error:', err);
      // Don't show error - just let user fill manually
      setScanned(true);
    } finally {
      setScanning(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgData = event.target?.result as string;
        setImageData(imgData);
        setError(null);
        // Automatically parse the receipt
        await parseReceipt(imgData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = () => {
    setImageData(null);
    setSupplier('');
    setAmount('');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setCategory('');
    setDescription('');
    setFolderId('');
    setInvoiceId('');
    setScanned(false);
    setConfidence(null);
    setAutoFilledFields(new Set());
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRescan = async () => {
    if (imageData) {
      setSupplier('');
      setAmount('');
      setReceiptDate(new Date().toISOString().slice(0, 10));
      setCategory('');
      setDescription('');
      setAutoFilledFields(new Set());
      await parseReceipt(imageData);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!imageData) {
      setError('Please capture or upload a receipt image');
      return;
    }
    if (!supplier.trim()) {
      setError('Please enter the supplier name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!folderId) {
      setError('Please select a folder to save the receipt to');
      return;
    }

    setLoading(true);
    setLoadingMessage('Uploading to Google Drive...');

    try {
      const token = localStorage.getItem('autow_token');
      const response = await fetch('/api/autow/receipt/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData,
          supplier: supplier.trim(),
          amount: parseFloat(amount),
          receipt_date: receiptDate,
          category: category || null,
          description: description.trim() || null,
          folderId: folderId || null,
          invoice_id: invoiceId ? parseInt(invoiceId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt');
      }

      setSuccess(`Receipt ${data.receipt.receipt_number} uploaded successfully!`);

      // Clear form after short delay
      setTimeout(() => {
        router.push('/autow/receipts');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const isFormValid = imageData && supplier.trim() && amount && parseFloat(amount) > 0 && folderId;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {(loading || scanning) && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>
            {scanning ? 'Scanning Receipt...' : loadingMessage}
          </div>
          {scanning && (
            <div style={styles.loadingSubtext}>
              AI is reading the receipt data
            </div>
          )}
        </div>
      )}

      <div style={styles.header}>
        <Image
          src="/logo.png"
          alt="AUTOW Logo"
          width={120}
          height={50}
          style={styles.logo}
          priority
        />
        <button style={styles.backButton} onClick={() => router.push('/autow/receipts')}>
          ← Back to Receipts
        </button>
      </div>

      <h1 style={styles.title}>Upload Receipt</h1>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={styles.hiddenInput}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={styles.hiddenInput}
      />

      {/* Image Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Receipt Image</div>
        <div style={styles.imageSection}>
          {imageData ? (
            <>
              <img src={imageData} alt="Receipt preview" style={styles.imagePreview} />
              <div style={styles.buttonRow}>
                <button style={styles.clearButton} onClick={handleClearImage}>
                  Clear
                </button>
                <button style={styles.rescanButton} onClick={handleRescan}>
                  Re-scan
                </button>
              </div>
            </>
          ) : (
            <div style={styles.buttonRow}>
              <button style={styles.captureButton} onClick={handleCameraCapture}>
                📷 Take Photo
              </button>
              <button style={styles.uploadButton} onClick={handleFileUpload}>
                📁 Upload from Gallery
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Banner */}
      {scanned && confidence !== null && (
        <div style={styles.confidenceBanner}>
          <span style={styles.confidenceText}>
            AI scanned your receipt and auto-filled the fields below
          </span>
          <span style={styles.confidenceScore}>
            {Math.round(confidence * 100)}% confident
          </span>
        </div>
      )}

      {scanned && autoFilledFields.size === 0 && (
        <div style={{ ...styles.confidenceBanner, borderColor: 'rgba(255, 152, 0, 0.3)', backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
          <span style={{ ...styles.confidenceText, color: '#ff9800' }}>
            Couldn't read receipt clearly - please fill in manually
          </span>
        </div>
      )}

      {/* Form Section */}
      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Supplier <span style={styles.required}>*</span>
            {autoFilledFields.has('supplier') && (
              <span style={styles.autoFillBadge}>Auto-filled</span>
            )}
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., Shell, Screwfix, GSF"
            style={autoFilledFields.has('supplier') ? styles.inputAutoFilled : styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Amount <span style={styles.required}>*</span>
            {autoFilledFields.has('amount') && (
              <span style={styles.autoFillBadge}>Auto-filled</span>
            )}
          </label>
          <div style={styles.amountGroup}>
            <span style={styles.currencySymbol}>£</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{ ...(autoFilledFields.has('amount') ? styles.inputAutoFilled : styles.input), flex: 1 }}
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Date
            {autoFilledFields.has('date') && (
              <span style={styles.autoFillBadge}>Auto-filled</span>
            )}
          </label>
          <input
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            style={autoFilledFields.has('date') ? styles.inputAutoFilled : styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Category
            {autoFilledFields.has('category') && (
              <span style={styles.autoFillBadge}>Auto-filled</span>
            )}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={autoFilledFields.has('category') ? { ...styles.select, borderColor: 'rgba(48, 255, 55, 0.4)' } : styles.select}
          >
            <option value="">Select category...</option>
            <option value="fuel">Fuel</option>
            <option value="parts">Parts</option>
            <option value="tools">Tools</option>
            <option value="supplies">Supplies</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Save to Folder <span style={styles.required}>*</span>
          </label>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            style={styles.select}
            disabled={loadingFolders}
          >
            <option value="">{loadingFolders ? 'Loading folders...' : 'Select folder...'}</option>
            {folders.expensesFolder && (
              <option value={folders.expensesFolder.id}>
                📁 General Expenses
              </option>
            )}
            {folders.invoiceFolders.length > 0 && (
              <optgroup label="Invoice Folders">
                {folders.invoiceFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    📂 {folder.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <span style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Link this receipt to an invoice folder or save to General Expenses
          </span>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Link to Invoice (Job Costing)
          </label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            style={{ ...styles.select, borderColor: invoiceId ? 'rgba(255, 165, 0, 0.4)' : '#333' }}
          >
            <option value="">No invoice (general expense)</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_number} - {inv.client_name} ({inv.vehicle_reg}) £{parseFloat(String(inv.total)).toFixed(2)}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#ffa500', marginTop: '4px' }}>
            Link to a paid invoice to track job profitability
          </span>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Description
            {autoFilledFields.has('description') && (
              <span style={styles.autoFillBadge}>Auto-filled</span>
            )}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any notes about this receipt..."
            style={autoFilledFields.has('description') ? { ...styles.textarea, borderColor: 'rgba(48, 255, 55, 0.4)' } : styles.textarea}
          />
        </div>

        <p style={styles.manualEntryNote}>
          You can edit any auto-filled fields before uploading
        </p>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          style={{
            ...styles.submitButton,
            ...((!isFormValid || loading) ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? 'Uploading...' : 'Upload Receipt'}
        </button>
      </div>
    </div>
  );
}
