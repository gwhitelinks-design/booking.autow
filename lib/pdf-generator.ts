import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Configure chromium for serverless environment
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

/**
 * Generate a PDF from a URL (typically a share link)
 * Returns the PDF as a Buffer for direct upload to Google Drive
 */
export async function generatePdfFromUrl(url: string): Promise<Buffer> {
  let browser = null;

  try {
    // Determine if we're running locally or in serverless
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;

    const launchOptions = isLocal
      ? {
          // Local development - use installed Chrome
          executablePath: process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : process.platform === 'darwin'
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : '/usr/bin/google-chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      : {
          // Serverless (Vercel) - use @sparticuz/chromium
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          args: chromium.args,
        };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2, // Higher quality
    });

    // Navigate to the URL and wait for network to be idle
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a bit for any animations/fonts to load
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Generate PDF as buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate invoice PDF from share token
 */
export async function generateInvoicePdf(shareToken: string): Promise<Buffer> {
  // Use the production URL for consistent rendering
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booking.autow-services.co.uk';
  const url = `${baseUrl}/share/invoice/${shareToken}`;

  return generatePdfFromUrl(url);
}
