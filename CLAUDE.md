# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **AUTOW Booking System** - a comprehensive business management application for AUTOW Services (mobile mechanic and automotive services). Built with Next.js 14 (App Router), TypeScript, and PostgreSQL (Supabase).

**Features**:
- Staff-only booking management (internal tool)
- Estimate creation and management
- Invoice generation and tracking
- Customer-facing share links for estimates and invoices
- Telegram notifications for bookings and document views
- Delete functionality with confirmation
- Smart Jotter with AI-powered OCR (camera/upload/drawing)
- Notes system with CRUD and booking conversion

## Development Commands

```bash
# Development server (http://localhost:3000/autow)
npm run dev

# Production build
npm run build

# Run production build locally
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

**Important**: The app runs at `/autow`, not root. Access at `http://localhost:3000/autow`

## Database Commands

```bash
# Apply schema (first time setup)
# Connect to your Supabase database and run:
psql $DATABASE_URL -f database/schema.sql

# Or manually execute schema.sql in Supabase SQL Editor
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router, not Pages Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase (connection pooling with `pg`)
- **Styling**: Inline CSS (React.CSSProperties objects, no external CSS frameworks)
- **Auth**: Simple token-based (localStorage + Bearer tokens)
- **Deployment**: Vercel

### Routing Structure

```
/autow                         → Login page
/autow/welcome                 → Dashboard menu (protected)
/autow/booking                 → New booking form (protected)
/autow/dashboard               → View all bookings (protected)
/autow/edit?id=X               → Edit booking (protected)
/autow/estimates               → List all estimates (protected)
/autow/estimates/create        → Create new estimate (protected)
/autow/estimates/edit?id=X     → Edit estimate (protected)
/autow/estimates/view?id=X     → View estimate details (protected)
/autow/invoices                → List all invoices (protected)
/autow/invoices/create         → Create new invoice (protected)
/autow/invoices/edit?id=X      → Edit invoice (protected)
/autow/invoices/view?id=X      → View invoice details (protected)
/autow/jotter                  → Smart Jotter - AI OCR input (protected)
/autow/notes                   → List all jotter notes (protected)
/autow/notes/view?id=X         → View note details (protected)
/autow/notes/edit?id=X         → Edit note with freeform jot area (protected)
/autow/receipts                → List all receipts with filters (protected)
/autow/receipts/upload         → Camera/file upload for receipts (protected)
/share/estimate/[token]        → Public estimate view (no auth)
/share/invoice/[token]         → Public invoice view (no auth)
```

All pages under `/autow` use a custom layout (`app/autow/layout.tsx`) with no header/footer. Share links are public and use a different layout.

### API Routes

**Authentication**
```
POST /api/autow/auth/login           → Authenticate staff
```

**Bookings**
```
POST /api/autow/booking/create       → Create booking
GET  /api/autow/booking/list         → List all bookings
GET  /api/autow/booking/get?id=X     → Get single booking
POST /api/autow/booking/update       → Update booking
POST /api/autow/booking/complete     → Mark completed
POST /api/autow/booking/delete       → Delete booking
```

**Estimates**
```
POST /api/autow/estimate/create              → Create estimate
GET  /api/autow/estimate/list                → List all estimates
GET  /api/autow/estimate/get?id=X            → Get single estimate
POST /api/autow/estimate/update              → Update estimate
POST /api/autow/estimate/delete              → Delete estimate
POST /api/autow/estimate/generate-share-link → Generate share link
POST /api/autow/estimate/convert-to-invoice  → Convert to invoice
```

**Invoices**
```
POST /api/autow/invoice/create               → Create invoice
GET  /api/autow/invoice/list                 → List all invoices
GET  /api/autow/invoice/get?id=X             → Get single invoice
POST /api/autow/invoice/update               → Update invoice
POST /api/autow/invoice/delete               → Delete invoice
POST /api/autow/invoice/mark-as-paid         → Mark as paid
POST /api/autow/invoice/generate-share-link  → Generate share link
```

**Smart Jotter**
```
POST /api/autow/jotter/parse         → Parse image/text with OpenAI Vision
POST /api/autow/jotter/recognize     → OCR recognition endpoint
```

**Notes**
```
POST /api/autow/note/create          → Create note from jotter
GET  /api/autow/note/list            → List all notes (optional status filter)
GET  /api/autow/note/get?id=X        → Get single note
POST /api/autow/note/update          → Update note
POST /api/autow/note/delete          → Delete note
POST /api/autow/note/convert-to-booking → Convert note to booking
```

**Receipts**
```
POST /api/autow/receipt/upload       → Upload receipt image to Google Drive + save metadata
GET  /api/autow/receipt/list         → List all receipts (optional month/category filter)
GET  /api/autow/receipt/get?id=X     → Get single receipt
POST /api/autow/receipt/delete       → Delete receipt (removes from DB and Drive)
POST /api/autow/receipt/parse        → AI-powered receipt parsing (Gemini Vision)
```

**Public Share Links (No Auth Required)**
```
GET  /api/share/estimate/[token]     → Get estimate by share token
GET  /api/share/invoice/[token]      → Get invoice by share token
```

All `/api/autow/*` endpoints require `Authorization: Bearer <token>` header. Share link endpoints are public but use secure UUID tokens.

### Database Schema

**Main tables**:

**`bookings`**
- Service types: Mobile Mechanic, Garage Service, Vehicle Recovery, ECU Remapping
- Status: confirmed, completed, cancelled
- Includes customer details, vehicle info, location, timing
- Auto-timestamps with trigger function
- **Important function**: `check_availability(date, time, duration)` prevents double-booking

**`estimates`**
- Quote documents for customers
- Status: draft, sent, accepted, declined, converted
- Includes client details, vehicle info, line items
- Supports share links via `share_token` (UUID)
- Auto-calculates subtotal, VAT (20%), and total
- Can be converted to invoices

**`invoices`**
- Final billing documents
- Status: pending, paid, overdue, cancelled
- Similar structure to estimates
- Tracks payment status and due dates
- Supports share links via `share_token` (UUID)
- Can be marked as paid

**`line_items`**
- Shared by both estimates and invoices
- Fields: description, item_type (part/service/labor/other/discount), rate, quantity, amount
- Polymorphic: `document_type` (estimate/invoice) + `document_id`
- Supports sorting via `sort_order`
- **Discount type**: Stored as positive amounts but subtracted from subtotal

**`business_settings`**
- Company information for documents
- Fields: business_name, email, address, phone, website, owner, workshop_location

**`jotter_notes`**
- Quick notes from Smart Jotter
- Status: draft, active, converted
- Includes customer details, vehicle info, issue description
- Stores raw input text and AI confidence score
- Can be converted to bookings
- Auto-generated note_number (JN-YYYYMMDD-XXX)

**`receipts`**
- Business expense receipt images and metadata
- Fields: receipt_number (REC-YYYYMMDD-XXX), receipt_date, supplier, description, amount, category
- Google Drive integration: gdrive_file_id, gdrive_file_url, gdrive_folder_path
- Status: pending, processed, matched
- Categories: fuel, parts, tools, supplies, misc
- Auto-organized in monthly folders (e.g., '2026-01')

**Share Link System**:
- Uses UUID tokens stored in `share_token` column
- Tokens are unique and indexed for fast lookup
- Public access without authentication
- Sends Telegram notification when viewed

See `database/schema.sql` for complete schema.

### State Management Pattern

- **Local state**: React `useState` for form data and UI state
- **Persistence**: `localStorage` for auth token only (`autow_token`)
- **No global state library**: Direct API calls with `fetch`
- **Route protection**: Client-side `useEffect` checks for token

### Authentication Flow

1. User logs in at `/autow` → username/password validated against env vars
2. Server returns token matching `AUTOW_STAFF_TOKEN` env var
3. Token stored in `localStorage.getItem('autow_token')`
4. All protected pages check for token, redirect to login if missing
5. All API calls include `Authorization: Bearer ${token}` header

**Security note**: This is a basic implementation with SHA-256 hashing. Single staff account only (no user database).

## Key Patterns and Conventions

### Component Pattern
All pages are client components (`'use client'`) with inline styles:

```typescript
const styles = {
  container: {
    backgroundColor: '#000',
    color: '#fff',
    minHeight: '100vh',
    padding: '20px'
  } as React.CSSProperties
};

return <div style={styles.container}>...</div>;
```

### API Call Pattern
```typescript
const token = localStorage.getItem('autow_token');
const response = await fetch('/api/autow/booking/list', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Database Query Pattern (`lib/db.ts`)
```typescript
import pool from '@/lib/db';

const result = await pool.query(
  'SELECT * FROM bookings WHERE id = $1',
  [bookingId]
);
```

Always use parameterized queries (`$1`, `$2`) to prevent SQL injection.

### Form Auto-Uppercase Fields
- Vehicle registration: Auto-uppercase on blur
- Postcode: Auto-uppercase on blur

### Availability Checking
Before creating/updating bookings, call database function:
```sql
SELECT check_availability($1::date, $2::time, $3::integer)
```

Returns `true` if slot is available, `false` if conflict exists.

## Brand Identity and Styling

- **Primary color**: `#30ff37` (neon green)
- **Background**: Black (`#000`)
- **Logo**: https://autow-services.co.uk/logo.png
- **Theme**: Dark with green accents
- **Button styles**: Green background, white text, pointer cursor, border-radius 5px

## Branding and Metadata (Social Media Sharing)

### Overview

When customers share invoice or estimate links on WhatsApp, Facebook, Twitter, or other platforms, the app displays AUTOW Services branding instead of generic "Create Next App" or Vercel branding. This is controlled through HTML metadata tags and Open Graph protocol.

### What Gets Shared

When a share link (`/share/invoice/[token]` or `/share/estimate/[token]`) is posted on social media:

**Title**: "AUTOW Services - Document"
**Description**: "View your estimate or invoice from AUTOW Services"
**Image**: AUTOW logo (1200x630px Open Graph image)
**Favicon**: AUTOW icon in browser tab

### Metadata Configuration

**Root Layout** (`app/layout.tsx`):
```typescript
export const metadata: Metadata = {
  title: 'AUTOW Services',
  description: 'Professional mobile mechanic and automotive services in Cornwall...',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'AUTOW Services',
    title: 'AUTOW Services - Professional Automotive Services',
    description: '...',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AUTOW Services',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};
```

**Share Layout** (`app/share/layout.tsx`):
- Dedicated layout for `/share/*` routes
- Prevents Google indexing (`robots: { index: false }`)
- Same Open Graph images and metadata
- Ensures share links display AUTOW branding

### Required Images in `public/` Folder

**1. Open Graph Image** (`public/og-image.png`)
- **Dimensions**: 1200 x 630 pixels
- **Format**: PNG or JPG
- **Purpose**: Appears when sharing links on social media
- **Current**: Copy of `latest2.png` logo
- **Optimal**: Custom design with logo + text on black background with green accent

**2. Favicon** (`public/favicon.ico`)
- **Dimensions**: 32 x 32 pixels (or multi-size .ico)
- **Format**: ICO file
- **Purpose**: Browser tab icon, bookmarks
- **Current**: Placeholder (85 bytes)
- **Recommended**: Convert logo using https://favicon.io/

**3. Apple Touch Icon** (`public/apple-touch-icon.png`)
- **Dimensions**: 180 x 180 pixels
- **Format**: PNG
- **Purpose**: iOS home screen icon when user saves as app
- **Current**: Copy of `latest2.png` logo

### How It Works

1. **Next.js Metadata API** automatically generates HTML `<meta>` tags in the `<head>`:
   ```html
   <meta property="og:title" content="AUTOW Services - Document" />
   <meta property="og:description" content="View your estimate or invoice..." />
   <meta property="og:image" content="https://yourdomain.com/og-image.png" />
   <meta name="twitter:card" content="summary_large_image" />
   ```

2. **Social media crawlers** (WhatsApp, Facebook, Twitter) read these tags when a link is shared

3. **Preview card displays**:
   - The title from `og:title`
   - The description from `og:description`
   - The image from `og:image`
   - The favicon from `<link rel="icon">`

### Testing Social Sharing

**Method 1: Social Media Debuggers**
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **OpenGraph**: https://www.opengraph.xyz/

**Method 2: Real Testing**
1. Create a test invoice or estimate
2. Generate share link
3. Send link via WhatsApp or paste into social media
4. Should display AUTOW branding (not "Create Next App")

**Method 3: Browser Developer Tools**
1. Open share link in browser
2. Right-click → View Page Source
3. Look for `<meta property="og:*">` tags in `<head>`
4. Verify content matches AUTOW branding

### Cache Clearing

Social media platforms cache Open Graph data. After updating metadata:

**WhatsApp**: Can take 24-48 hours to update cache (no manual clear)
**Facebook**: Use https://developers.facebook.com/tools/debug/ → "Scrape Again"
**Twitter**: Use https://cards-dev.twitter.com/validator → re-validate
**LinkedIn**: Use https://www.linkedin.com/post-inspector/ → "Inspect"

### Customizing Images

To create better Open Graph images:

**Option 1: Canva (Free)**
1. Go to https://www.canva.com/
2. Search "Open Graph" or create 1200x630px design
3. Add AUTOW logo from `public/latest2.png`
4. Add text: "AUTOW Services - Professional Automotive Services"
5. Use brand colors: Black `#000000` background, Green `#30ff37` accent
6. Download as PNG
7. Save as `public/og-image.png`
8. Commit and deploy

**Option 2: Design Tool (Photoshop, Figma, etc.)**
1. Create 1200 x 630 canvas
2. Black background `#000000`
3. Center AUTOW logo
4. Add text overlay with business tagline
5. Export as PNG (optimize for web, ~100-200 KB)
6. Replace `public/og-image.png`

**Option 3: Favicon Generator**
For favicon.ico and apple-touch-icon.png:
1. Go to https://favicon.io/favicon-converter/
2. Upload your logo (`public/latest2.png`)
3. Download generated favicon package
4. Replace `public/favicon.ico`
5. Optionally replace `public/apple-touch-icon.png` with higher quality version

### Environment Variable

The `metadataBase` URL is set from environment variable:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

This ensures all Open Graph URLs are absolute (required by social media crawlers).

### SEO and Privacy

**Share Pages** (`/share/*`):
- Set `robots: { index: false, follow: false }`
- Prevents Google from indexing share links
- Keeps customer invoices/estimates private
- Links are still shareable but not searchable

**Main App** (`/autow`):
- Normal metadata without noindex
- Can appear in search results for "AUTOW Services"
- Login required for access anyway

### File Structure

```
app/
├── layout.tsx              # Root metadata (site-wide)
├── share/
│   ├── layout.tsx          # Share-specific metadata (NEW)
│   ├── invoice/[token]/
│   │   └── page.tsx        # Invoice share page
│   └── estimate/[token]/
│       └── page.tsx        # Estimate share page
└── autow/
    └── layout.tsx          # Staff app layout (no metadata)

public/
├── og-image.png            # 1200x630 social media image (NEW)
├── favicon.ico             # 32x32 browser icon (existing)
├── apple-touch-icon.png    # 180x180 iOS icon (NEW)
└── latest2.png             # Original logo (used in documents)
```

### Common Issues and Solutions

**Issue**: Shared link still shows "Create Next App"
- **Solution**: Clear social media cache (see Cache Clearing above)
- **Solution**: Wait 24 hours for WhatsApp cache to expire
- **Solution**: Verify deployment completed on Vercel

**Issue**: Image not appearing in share preview
- **Solution**: Check `og-image.png` exists in `public/` folder
- **Solution**: Verify `NEXT_PUBLIC_APP_URL` is set in Vercel env vars
- **Solution**: Image must be absolute URL (not relative path)
- **Solution**: Image must be under 8 MB for most platforms

**Issue**: Wrong title/description appearing
- **Solution**: Check `app/share/layout.tsx` exists
- **Solution**: Verify metadata in `app/layout.tsx` is correct
- **Solution**: Clear browser cache and rebuild: `npm run build`

**Issue**: Changes not showing after deployment
- **Solution**: Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Solution**: Clear social platform cache using debugger tools
- **Solution**: Generate new share link (new token may bypass cache)

### Documentation Files

- **`BRANDING_SETUP.md`**: Detailed guide for image creation and customization
- **`app/layout.tsx`**: Root metadata configuration
- **`app/share/layout.tsx`**: Share page metadata configuration

### Future Enhancements

Potential improvements:
1. **Dynamic Open Graph images**: Generate unique image per invoice/estimate with amount
2. **Multiple Open Graph images**: Different images for estimates vs invoices
3. **Structured data**: Add JSON-LD for rich search results
4. **Custom domain**: Use custom domain instead of .vercel.app
5. **Analytics**: Track share link views with Open Graph tags

## Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:pass@host:port/db
AUTOW_STAFF_USERNAME=admin
AUTOW_STAFF_PASSWORD=your-password
AUTOW_STAFF_TOKEN=your-secure-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional (currently configured)
```env
TELEGRAM_BOT_TOKEN=xxx        # Active: sends new booking notifications
TELEGRAM_CHAT_ID=xxx          # Active: recipient for notifications
OPENAI_API_KEY=xxx            # Active: Smart Jotter OCR parsing (GPT-4o-mini vision)
GOOGLE_DRIVE_FOLDER_ID=xxx    # Active: receipts storage root folder
GOOGLE_CLIENT_EMAIL=xxx       # Active: Google service account for Drive API
GOOGLE_PRIVATE_KEY=xxx        # Active: Google service account private key
ANTHROPIC_API_KEY=xxx         # Active: Voice Assistant AI (Claude)
ELEVENLABS_API_KEY=xxx        # Active: Voice Assistant TTS
ELEVENLABS_VOICE_ID=xxx       # Active: Voice ID (default: kT6e56V1Tau6nyzxdCPf)
```

### Optional (placeholders, not implemented)
```env
GOOGLE_CALENDAR_ID=...        # For calendar sync (future feature)
EMAIL_FROM=...                # For email notifications
SMTP_HOST=...
```

**Never commit `.env.local`** - use `.env.example` as template.

## External Integrations

### Active
- **Telegram Bot** (`lib/telegram.ts`): Sends notifications for:
  - **New bookings**: When staff creates a booking via `/api/autow/booking/create`
  - **Share link views**: When customer opens estimate or invoice share link
  - Notifications include: client details, vehicle info, amounts, timestamps
  - Non-blocking (doesn't fail if Telegram fails)
  - Uses same bot token for both notification types

- **Google Drive** (`lib/google-drive.ts`): Receipt image storage:
  - Uses service account authentication (GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)
  - Auto-creates monthly folders (e.g., '2026-01', '2026-02')
  - Uploads receipt images with naming: `RECEIPT_YYYYMMDD_HHMMSS_supplier.jpg`
  - Sets public read permissions for viewable links
  - Root folder: GOOGLE_DRIVE_FOLDER_ID
  - Helper functions: ensureMonthlyFolder, uploadReceiptImage, deleteFile

### Placeholder (Not Implemented)
- **Google Calendar**: Schema has `calendar_event_id` field but no active code
- **Email Notifications**: `nodemailer` installed but not configured
- **n8n Webhooks**: No integration currently, but can easily add

### How to Add n8n Integration
1. Create webhook workflow in n8n
2. Add `N8N_WEBHOOK_URL=https://your-n8n.com/webhook/booking` to env
3. In `app/api/autow/booking/create/route.ts`, add after successful insert:
```typescript
if (process.env.N8N_WEBHOOK_URL) {
  await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
}
```

## Database Connection Details

- **Host**: Supabase pooler (aws-1-eu-north-1.pooler.supabase.com)
- **Project ID**: `kctnocfwcomphprybnud`
- **SSL**: Enabled with `rejectUnauthorized: false` (Supabase uses self-signed certs)
- **Connection Pooling**: Yes, via `pg.Pool` in `lib/db.ts`
- **Query Logging**: All queries logged to console in development

### CRITICAL: Shared Database Warning

**This database is SHARED between multiple projects:**

| Project | Tables Used |
|---------|-------------|
| **AUTOW Booking** | bookings, estimates, invoices, line_items, disclaimers, jotter_notes, receipts, vehicle_reports, business_settings, business_* |
| **AUTOW Parts Bot** | suppliers, subscription_plans, quotes, usage_logs, team_members, magic_tokens, users |

**NEVER modify or drop tables you don't recognize** - they belong to the Parts Bot project.

### Migration Protocol (MANDATORY)

When adding new database features:

1. **Create migration file** in `database/migrations/` with descriptive name
2. **Test locally first** - run migration against local/dev database
3. **Apply to production** - run migration in Supabase SQL Editor OR via node script:
   ```bash
   cd /d/Projects-AI/autow-booking && node -e "
   const { Pool } = require('pg');
   require('dotenv').config({ path: '.env.local' });
   const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
   // Run your SQL here
   pool.query('YOUR SQL').then(() => console.log('Done')).finally(() => pool.end());
   "
   ```
4. **Verify deployment** - test the feature on production after deploying code

### Incident Log

| Date | Issue | Resolution |
|------|-------|------------|
| 2026-01-21 | Disclaimers 500 error - table existed but missing columns (customer_name, customer_address, vehicle_reg, vehicle_make, vehicle_model). Customer disclaimer data was lost (table was empty). | Added missing columns via ALTER TABLE. Root cause: migration file existed but was never applied to production database. |

## Type Definitions

Main types in `lib/types.ts`:

```typescript
interface Booking {
  id?: number;
  booked_by: string;          // Staff member name (editable field)
  booking_date: string;       // YYYY-MM-DD
  booking_time: string;       // HH:mm
  service_type: string;       // One of 4 service types
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg: string;
  location_address: string;
  location_postcode: string;
  issue_description: string;
  notes?: string;
  status?: string;            // confirmed/completed/cancelled
  estimated_duration?: number; // minutes (default: 90)
  // ... timestamps
}

interface Estimate {
  id?: number;
  user_id?: number;
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  estimate_date: string;      // YYYY-MM-DD
  estimate_number?: string;
  subtotal: number;
  vat_rate: number;           // 20
  vat_amount: number;
  total: number;
  notes?: string;
  status: string;             // draft/sent/accepted/declined/converted
  share_token?: string;       // UUID for share links
  line_items?: LineItem[];
  // ... timestamps
}

interface Invoice {
  id?: number;
  user_id?: number;
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client_mobile?: string;
  vehicle_reg?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  invoice_date: string;       // YYYY-MM-DD
  invoice_number?: string;
  due_date?: string;          // YYYY-MM-DD
  subtotal: number;
  vat_rate: number;           // 20
  vat_amount: number;
  total: number;
  balance_due: number;
  notes?: string;
  status: string;             // pending/paid/overdue/cancelled
  share_token?: string;       // UUID for share links
  line_items?: LineItem[];
  // ... timestamps
}

interface LineItem {
  id?: number;
  document_type: 'estimate' | 'invoice';
  document_id: number;
  description: string;
  item_type: 'part' | 'service' | 'labor' | 'other' | 'discount';
  rate: number;
  quantity: number;
  amount: number;             // rate * quantity
  sort_order?: number;
}

interface JotterNote {
  id?: number;
  note_number: string;        // Auto-generated JN-YYYYMMDD-XXX
  note_date: string;          // YYYY-MM-DD
  status: 'draft' | 'active' | 'converted';
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_reg?: string;
  vehicle_year?: string;
  issue_description?: string;
  notes?: string;             // Freeform jot area
  raw_input?: string;         // Original OCR/input text
  confidence_score?: number;  // AI confidence (0-1)
  booking_id?: number;        // Link to converted booking
  // ... timestamps
}
```

## Dashboard Statistics Logic

Statistics are calculated from the bookings array:
- **Today's Jobs**: Bookings with `booking_date === today`
- **Pending**: Status = 'confirmed'
- **Completed**: Status = 'completed'
- **Total Upcoming**: All future bookings (date >= today)

## Key Features

### Share Links
- **Generation**: Click "Share Link" on any estimate or invoice to generate a unique URL
- **UUID Tokens**: Each share link uses a cryptographically secure UUID (e.g., `abc123-def456-...`)
- **Public Access**: No authentication required - customers can view without logging in
- **Telegram Notifications**: You receive instant notification when customer opens the link
- **Logo**: Share pages use `/latest2.png` from public directory
- **Print Friendly**: Customers can print or save as PDF

### Delete Functionality
- **Confirmation**: All delete actions require confirmation dialog
- **Red Styling**: Delete buttons are red to prevent accidental clicks
- **Cascade Delete**: Deleting estimate/invoice also removes related line items and photos
- **Transaction Safety**: Uses database transactions for data integrity

### Booking Form
- **Booked By Field**: Visible at top of form, pre-filled with username, editable
- **Auto-Uppercase**: Vehicle reg and postcode automatically uppercase
- **Availability Check**: Prevents double-booking using database function
- **Telegram Notification**: Sends notification immediately after booking created

### Estimates & Invoices
- **Line Items**: Add multiple items with different types (parts, service, labor, other, discount)
- **Auto-Calculate**: Subtotal, VAT (20%), and total calculated automatically
- **Status Tracking**: Track document lifecycle (draft → sent → accepted/paid)
- **Convert to Invoice**: Estimates can be converted to invoices with one click
- **Mark as Paid**: Invoices can be marked as paid to track payment status

### Discount System
- **Add Discount Button**: Orange button next to "Add Line Item" for quick discount entry
- **Discount Types**: Two modes available in edit modal:
  - **Flat Rate (£)**: Enter fixed discount amount
  - **Percentage (%)**: Enter percentage, auto-calculates from non-discount subtotal
- **Visual Styling**: Discounts displayed in orange (#ff9800) throughout UI
- **Calculation**: Discounts stored as positive amounts, subtracted from subtotal before VAT
- **Edit Modal**: Click edit button (✎) on any line item to open modal with discount mode toggle
- **Live Preview**: Percentage mode shows subtotal and calculated discount amount in real-time
- **Share Pages**: Customer-facing share links display discounts with proper styling

### Smart Jotter
- **Camera Input**: Take photo of handwritten notes or documents
- **Upload Input**: Upload existing images for OCR
- **Drawing Canvas**: Draw/write directly on screen (touch/mouse)
- **Text Input**: Type notes directly
- **AI Parsing**: OpenAI Vision API extracts customer, vehicle, and issue data
- **Confidence Score**: Shows AI confidence in extracted data
- **Quick Actions**: Save as Note or Create Booking directly from parsed data

### Notes System
- **List View**: Filter by status (draft, active, converted)
- **View Details**: Full note with customer, vehicle, issue info
- **Edit Page**: Large freeform jot area + collapsible structured fields
- **Convert to Booking**: Pre-fills booking form with note data
- **Delete**: Remove notes with confirmation
- **Mobile Responsive**: Uses global CSS mobile classes

### Voice Assistant (EDITH)
An EDITH-style voice-activated AI assistant integrated into every page of the app.

**Features:**
- **Voice Input**: Speak naturally to fill forms, navigate, and manage bookings
- **Text Input**: Type messages as fallback when voice isn't suitable
- **Speech Output**: ElevenLabs TTS with custom British voice
- **Smart Form Filling**: Understands natural language for dates, times, phone numbers
- **Navigation**: Quick commands like "go to invoices" or "new booking"
- **Business Advisor**: Ask questions about HMRC rates, tax obligations, pricing strategies
- **Context-Aware**: Knows which page you're on and what fields are available

**Activation:**
- Click the floating mic button (bottom-right corner)
- Press Ctrl+Space keyboard shortcut
- Press Escape to close

**Quick Commands:**
- "go to dashboard" / "show bookings"
- "new booking" / "create estimate" / "new invoice"
- "go to business hub" / "track mileage"
- "upload receipt" / "show reports"

**Form Filling Examples:**
- "Create a booking for John Smith, phone 07123456789"
- "The vehicle is a Ford Focus, registration AB12 CDE"
- "Set the booking date to tomorrow at 2pm"
- "Add a line item for brake pads, 150 pounds"

**Business Advisor Mode:**
- "What's the HMRC mileage rate?"
- "How much can I claim for mileage this year?"
- "When is the VAT return deadline?"
- "Should I register for VAT?"

**Technical Details:**
- Backend: `/api/autow/voice/chat` - Claude API + command parsing
- Frontend: `components/voice-assistant/` - React context + widgets
- Speech: Web Speech API (STT) + ElevenLabs (TTS)
- Voice ID: `kT6e56V1Tau6nyzxdCPf` (British assistant voice)

**Files:**
- `components/voice-assistant/VoiceProvider.tsx` - Main context provider
- `components/voice-assistant/VoiceWidget.tsx` - Floating widget UI
- `components/voice-assistant/VoiceChat.tsx` - Chat message panel
- `components/voice-assistant/VoiceMicButton.tsx` - Animated mic button
- `lib/voice/types.ts` - Type definitions and quick commands
- `lib/voice/system-prompt.ts` - AI system prompt with business knowledge
- `lib/voice/command-parser.ts` - Parse AI commands from responses
- `lib/voice/tts.ts` - ElevenLabs TTS integration
- `app/api/autow/voice/chat/route.ts` - Voice chat API endpoint

## Critical Files

**Core Application**
- `lib/db.ts` - Database connection pool (modify for different database)
- `lib/types.ts` - TypeScript interfaces (modify when schema changes)
- `lib/telegram.ts` - Telegram notification functions (booking + share links)
- `lib/google-drive.ts` - Google Drive API helper functions (receipt uploads)
- `database/schema.sql` - Complete database schema with functions and indexes
- `.env.local` - Local configuration (never commit this)

**Layouts and Metadata**
- `app/layout.tsx` - Root layout with complete Open Graph metadata and branding
- `app/share/layout.tsx` - Share page layout with metadata (prevents Google indexing)
- `app/autow/layout.tsx` - Staff app layout (removes default Next.js chrome)

**Branding Assets**
- `public/og-image.png` - Open Graph image for social media sharing (1200x630)
- `public/favicon.ico` - Browser tab icon (32x32)
- `public/apple-touch-icon.png` - iOS home screen icon (180x180)
- `public/latest2.png` - Original logo used in documents
- `BRANDING_SETUP.md` - Guide for customizing branding and images

**API Routes**
- `app/api/autow/booking/create/route.ts` - Booking creation with availability check
- `app/api/autow/jotter/parse/route.ts` - OpenAI Vision API parsing
- `app/api/autow/note/*/route.ts` - Notes CRUD operations
- `app/api/share/estimate/[token]/route.ts` - Public estimate viewing with notification
- `app/api/share/invoice/[token]/route.ts` - Public invoice viewing with notification

**Smart Jotter**
- `components/smart-jotter/SmartJotter.tsx` - Main jotter component with camera/upload/draw
- `app/autow/jotter/page.tsx` - Jotter page wrapper
- `types/smart-jotter.ts` - Smart Jotter type definitions

**Notes Pages**
- `app/autow/notes/page.tsx` - Notes list with status filters
- `app/autow/notes/view/page.tsx` - View note details
- `app/autow/notes/edit/page.tsx` - Edit note with freeform jot area

**Receipts Pages**
- `app/autow/receipts/page.tsx` - Receipts list with month/category filters
- `app/autow/receipts/upload/page.tsx` - Camera/file upload with form fields

**Receipts API**
- `app/api/autow/receipt/upload/route.ts` - Upload to Drive + save metadata
- `app/api/autow/receipt/list/route.ts` - List receipts with filters
- `app/api/autow/receipt/get/route.ts` - Get single receipt details
- `app/api/autow/receipt/delete/route.ts` - Delete from DB and Drive
- `app/api/autow/receipt/parse/route.ts` - AI-powered receipt OCR

**Database Migrations**
- `migrations/create_jotter_notes_table.sql` - Jotter notes table schema
- `database/migrations/create_receipts_table.sql` - Receipts table schema

**Share Pages**
- `app/share/estimate/[token]/page.tsx` - Customer-facing estimate page
- `app/share/invoice/[token]/page.tsx` - Customer-facing invoice page

## Common Development Tasks

### Adding a New Field to Bookings

1. **Update database**:
```sql
ALTER TABLE bookings ADD COLUMN new_field VARCHAR(255);
```

2. **Update TypeScript interface** (`lib/types.ts`):
```typescript
interface Booking {
  // ... existing fields
  new_field?: string;
}
```

3. **Update form** (`app/autow/booking/page.tsx` and `app/autow/edit/page.tsx`):
```typescript
const [newField, setNewField] = useState('');
// Add input field in JSX
<input value={newField} onChange={(e) => setNewField(e.target.value)} />
```

4. **Update API** (`app/api/autow/booking/create/route.ts`):
```typescript
const query = `INSERT INTO bookings (..., new_field) VALUES (..., $X)`;
const values = [..., newField];
```

### Adding a New Service Type

1. Update dropdown in `app/autow/booking/page.tsx`:
```typescript
<option value="New Service">New Service</option>
```

2. Update edit page dropdown similarly
3. No database change needed (service_type is VARCHAR)

### Changing Authentication

To add multiple users, you would need to:
1. Create a `users` table in database
2. Hash passwords with bcrypt (not SHA-256)
3. Update `app/api/autow/auth/login/route.ts` to query users table
4. Consider adding JWT tokens instead of static token
5. Add user management UI

## Deployment

**Vercel is the recommended platform** (Next.js creators):

1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Deploy (automatic on every push to main branch)

**Critical**: Ensure all env vars are set in Vercel, especially:
- `DATABASE_URL` (Supabase connection string)
- `AUTOW_STAFF_TOKEN` (must match what's in login API)
- `NEXT_PUBLIC_APP_URL` (production URL)

**Database**: Supabase database is already in production (shared between dev and prod).

## Troubleshooting

### "Invalid token" errors
- Check `AUTOW_STAFF_TOKEN` in `.env.local` matches what login API expects
- Token is stored in localStorage - clear browser localStorage and re-login
- Verify token is being sent in Authorization header

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check Supabase project is not paused (free tier pauses after inactivity)
- Ensure SSL is enabled (`sslmode=require` in connection string)
- Check connection pool isn't exhausted (default max: 20)

### "Booking slot not available"
- Check `check_availability()` function logic in database
- Verify booking dates/times are in correct format
- Check for existing bookings at that time in database

### Telegram notifications not sending
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correct
- Check bot is not blocked
- Notifications fail silently - check API logs for errors

### Pages redirect to login
- Token expired or invalid
- Clear localStorage and re-login
- Check token validation logic in API routes

### Share links show "Create Next App" or Vercel branding
- Social media platforms cache Open Graph data (can take 24-48 hours to update)
- Use Facebook debugger to force cache clear: https://developers.facebook.com/tools/debug/
- Verify `NEXT_PUBLIC_APP_URL` is set correctly in Vercel environment variables
- Check `public/og-image.png` exists and is accessible
- Verify `app/share/layout.tsx` exists with proper metadata
- Generate a new share link (new token may bypass cache)

### Open Graph image not showing in share preview
- Image must be absolute URL (check `metadataBase` in `app/layout.tsx`)
- Image size must be under 8 MB for most platforms
- Recommended dimensions: 1200 x 630 pixels
- Use https://www.opengraph.xyz/ to test
- Check browser console for 404 errors on image load

### Favicon not updating in browser
- Browser caches favicons aggressively
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache completely
- Try different browser to verify
- Check `public/favicon.ico` exists and is valid .ico format

## Architecture Decisions

**Why Next.js App Router?**
- Modern React patterns (Server Components when needed)
- File-system routing
- API routes in same codebase
- Optimized for Vercel deployment

**Why inline styles instead of CSS framework?**
- Full control over styling
- No external dependencies
- Easier to maintain for small team
- Dark theme is simple to implement

**Why single staff account?**
- Current business need (small team)
- Simpler implementation
- Can be extended to multi-user when needed

**Why client-side route protection?**
- Sufficient for internal tool
- App Router allows for server-side protection if needed later
- Token validation happens on API level anyway

**Why PostgreSQL?**
- Robust relational database
- Advanced features (custom functions, triggers)
- Supabase provides free tier with good performance
- Easy to scale

## Vehicle Damage Assessments

### Overview

The assessment system allows creating detailed vehicle damage reports that can be shared with insurance companies and customers. Reports include damage findings, cost estimates, photos with markers, and write-off category recommendations.

### Routes

```
/autow/assessments              → List all assessments (protected)
/autow/assessments/create       → Create new assessment (coming soon)
/autow/assessments/view?id=X    → View assessment summary (protected)
/share/assessment/[token]       → Public shareable assessment report
```

### Assessment Report Features (`/share/assessment/[token]`)

The public assessment report includes:

1. **Vehicle Information Header**
   - Registration, Make, Model, Engine, Colour, Year
   - Assessment date, method, video duration, assessor name

2. **Critical Alerts Banner**
   - Red banner highlighting safety-critical issues
   - Numbered list of critical findings

3. **Assessment Voice Transcript**
   - Full text of the assessment narration
   - Diagnostic fault codes mentioned

4. **Key Findings Summary**
   - Categorized by severity: Critical, Structural, Undercarriage, Body & Trim
   - Color-coded markers (red=critical, orange=high, yellow=medium)

5. **Damage Location Map**
   - Interactive diagram with clickable damage markers
   - Tooltips show damage description on hover/tap
   - Legend explaining severity colors

6. **Assessor's Conclusion**
   - Summary of damage extent
   - List of resulting issues
   - Final assessment statement

7. **Insurance Claim Assessment**
   - Detailed repair cost table by category
   - Vehicle market value comparison
   - Cost vs value ratio calculation
   - Recommendation banner

8. **Write-Off Category Boxes**
   - **Category S**: Structural damage - repairable but requires inspection
   - **Category N**: Non-structural damage - cosmetic/mechanical only
   - Both shown for reference, applicable category highlighted

9. **Notes and Footer**
   - Disclaimer about estimate variations
   - Report compilation date and assessor details

### Static Assessment Data

Currently using static data for the HN14-UWY Citroen C3 assessment. Data structure in `app/share/assessment/[token]/page.tsx`:

```typescript
const staticAssessments = {
  'HN14-UWY': {
    id: 'HN14-UWY',
    vehicle_reg: 'HN14 UWY',
    vehicle_make: 'Citroen',
    vehicle_model: 'C3',
    // ... vehicle details
    transcript: '...', // Full assessment narration
    critical_alerts: [...], // Array of critical issues
    findings: {
      critical: [...],
      structural: [...],
      undercarriage: [...],
      body: [...]
    },
    conclusion: [...],
    cost_estimates: [...], // Repair cost breakdown
    damage_markers: [...] // Interactive map markers
  }
};
```

### Future: Database Integration

When ready to store assessments in database, create table:

```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  token VARCHAR(50) UNIQUE NOT NULL,
  vehicle_reg VARCHAR(20),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  -- ... other fields
  transcript TEXT,
  findings JSONB,
  cost_estimates JSONB,
  damage_markers JSONB,
  recommendation VARCHAR(50),
  write_off_category VARCHAR(5),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Global Mobile Responsive CSS System

### Overview

A centralized CSS system in `app/globals.css` provides mobile-responsive classes that all pages inherit automatically. This ensures consistent mobile experience across the entire application.

### File Structure

```
app/
├── globals.css          # Global mobile responsive styles (NEW)
├── layout.tsx           # Root layout - imports globals.css
└── share/
    └── assessment/
        └── [token]/
            └── page.tsx # Uses mobile-* classes
```

### Breakpoints

Three responsive breakpoints are defined:

| Breakpoint | Max Width | Target Devices |
|------------|-----------|----------------|
| Tablet | 768px | iPad, tablets |
| Mobile | 480px | Smartphones |
| Extra Small | 360px | Small phones |

### Available Mobile Classes

**Layout & Containers**
- `.mobile-container` - Reduced padding on mobile
- `.mobile-header` - Smaller header padding and border radius
- `.mobile-card` - Compact card styling

**Typography**
- `.mobile-title` - Smaller heading text
- `.mobile-subtitle` - Smaller subtitle text
- `.mobile-text` - Reduced body text size

**Components**
- `.mobile-btn` - Smaller buttons with reduced padding
- `.mobile-badge` - Compact badges
- `.mobile-alert` - Smaller alert boxes
- `.mobile-table` - Compact table styling

**Grid & Info**
- `.mobile-grid` - 2-column grid on mobile, 1-column on extra small
- `.mobile-info-item` - Compact info cards
- `.mobile-info-label` - Tiny label text
- `.mobile-info-value` - Smaller value text

**Findings & Lists**
- `.mobile-finding-title` - Compact section titles
- `.mobile-finding-item` - Smaller list items
- `.mobile-finding-marker` - Smaller severity markers

**Value Boxes**
- `.mobile-value-box` - Compact value containers
- `.mobile-value-title` - Smaller value labels
- `.mobile-value-amount` - Adjusted amount text size

**Special Components**
- `.mobile-recommendation` - Compact recommendation banner
- `.mobile-category` - Smaller category badges
- `.mobile-legend` - Compact map legend
- `.mobile-footer` - Smaller footer

**Utility Classes**
- `.hide-mobile` - Hidden on tablets and below (768px)
- `.hide-mobile-sm` - Hidden on mobile and below (480px)
- `.no-print` - Hidden when printing

### Usage Example

```tsx
<div style={styles.container} className="mobile-container">
  <h1 style={styles.title} className="mobile-title">Page Title</h1>
  <button style={styles.btn} className="mobile-btn">Click Me</button>
  <div style={styles.card} className="mobile-card">
    <table style={styles.table} className="mobile-table">
      <th className="hide-mobile">Full Column</th>
      <th className="hide-mobile-sm">Tablet+ Only</th>
    </table>
  </div>
</div>
```

### Damage Markers

Special styling for interactive damage markers on assessment diagrams:

```css
.damage-marker {
  /* Base: 24px circles */
  /* Mobile: 12px circles */
  /* Extra small: Even smaller */
}

.damage-marker::after {
  /* Tooltip on hover */
  /* Smaller font on mobile */
}
```

## Recent Session Notes

### Session: 2026-01-10 - Receipts Feature Implementation

**Features Built:**

1. **Receipt Upload System**
   - Camera capture and file upload for receipt images
   - Auto-upload to Google Drive in monthly folders (YYYY-MM)
   - File naming: `RECEIPT_YYYYMMDD_HHMMSS_supplier.jpg`
   - Form fields: Supplier, Amount, Date, Description, Category

2. **Google Drive Integration** (`lib/google-drive.ts`)
   - Service account authentication
   - Auto-create monthly folders if not exist
   - Upload with public read permissions
   - Delete files when receipts are deleted
   - Helper functions: ensureMonthlyFolder, uploadReceiptImage, findFolderByName

3. **Receipts List Page** (`app/autow/receipts/page.tsx`)
   - Month filter dropdown
   - Category filter
   - Receipt cards with: date, supplier, amount, category
   - "View in Drive" link opens Google Drive file
   - Delete with confirmation

4. **API Routes**
   - `POST /api/autow/receipt/upload` - Upload to Drive + save metadata
   - `GET /api/autow/receipt/list` - List with optional month/category filters
   - `GET /api/autow/receipt/get?id=X` - Get single receipt
   - `POST /api/autow/receipt/delete` - Delete from DB and Drive
   - `POST /api/autow/receipt/parse` - AI-powered OCR (Gemini Vision)

5. **Database**
   - Created `receipts` table
   - Migration file: `database/migrations/create_receipts_table.sql`

6. **Navigation**
   - Added "Receipts" to welcome menu
   - Accessible from main dashboard

**Environment Variables Added:**
- `GOOGLE_DRIVE_FOLDER_ID` - Root folder for receipt storage
- (Uses existing GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY)

---

### Session: 2026-01-07 - Discount Feature Implementation

**Features Built:**

1. **Discount Line Item Type**
   - Added 'discount' to `item_type` union in `lib/types.ts`
   - Discounts displayed in orange (#ff9800) throughout UI
   - Stored as positive amounts, subtracted from subtotal before VAT

2. **Add Discount Button**
   - Orange "Add Discount" button next to green "Add Line Item"
   - Available on both estimates and invoices create pages

3. **Discount Mode Toggle (Edit Modal)**
   - Flat Rate (£): Enter fixed discount amount with rate/quantity
   - Percentage (%): Enter percentage, auto-calculates from non-discount subtotal
   - Live preview shows subtotal and calculated discount amount
   - Toggle buttons with active state styling

4. **Files Modified:**
   - `lib/types.ts` - Added 'discount' to LineItem.item_type
   - `app/autow/estimates/create/page.tsx` - Full discount feature with modal
   - `app/autow/invoices/create/page.tsx` - Full discount feature with modal
   - `app/autow/estimates/view/page.tsx` - Discount display in totals
   - `app/autow/invoices/view/page.tsx` - Discount display in totals
   - `app/share/estimate/[token]/page.tsx` - Customer-facing discount display
   - `app/share/invoice/[token]/page.tsx` - Customer-facing discount display

5. **New Styles Added:**
   - `discountRow`, `discountType`, `discountBadge` - Orange text/badges
   - `addDiscountButton` - Orange button styling
   - `amountDisplayDiscount` - Orange amount display
   - `discountModeToggle`, `discountModeBtn`, `discountModeActive` - Toggle UI
   - `discountPreview`, `discountAmountValue` - Preview section

**Commits:**
- `57a7710` - Add discount feature with flat rate and percentage options
- `8ccaca9` - Add discount to LineItem type definition

**Deployed to:** https://booking.autow-services.co.uk

---

### Session: 2026-01-05 (Part 2) - Smart Jotter & Notes System

**Features Built:**

1. **Smart Jotter Component** (`components/smart-jotter/SmartJotter.tsx`)
   - Camera capture for handwritten notes/documents
   - Image upload for existing photos
   - Drawing canvas with touch/mouse support
   - Text input for typed notes
   - OpenAI Vision API integration (GPT-4o-mini)
   - AI-powered data extraction (customer, vehicle, issue)
   - Confidence score display
   - Actions: Save as Note, Create Booking

2. **Notes System**
   - Full CRUD: list, view, edit, delete
   - Status filtering: draft, active, converted
   - Convert to booking (pre-fills booking form)
   - Freeform jot area on edit page
   - Collapsible structured fields
   - Mobile responsive with global CSS classes

3. **API Routes**
   - `POST /api/autow/jotter/parse` - OpenAI Vision parsing
   - `POST /api/autow/note/create` - Create note
   - `GET /api/autow/note/list` - List notes
   - `GET /api/autow/note/get` - Get single note
   - `POST /api/autow/note/update` - Update note
   - `POST /api/autow/note/delete` - Delete note
   - `POST /api/autow/note/convert-to-booking` - Convert to booking

4. **Navigation Updates**
   - Smart Jotter added to welcome menu
   - Notes added to welcome menu
   - Smart Jotter button on dashboard
   - Notes button on dashboard

5. **Database**
   - Created `jotter_notes` table
   - Migration file: `migrations/create_jotter_notes_table.sql`

**Commits:**
- `39cdd7a` - Add Smart Jotter and Notes system with mobile CSS support
- `baa2fab` - Fix duplicate property error in booking page

**Deployed to:** https://booking.autow-services.co.uk

---

### Session: 2026-01-05 (Part 1) - Global CSS & Assessments

**Changes Made:**

1. **Created Global CSS System**
   - New file: `app/globals.css`
   - Imported in `app/layout.tsx`
   - Mobile-responsive classes for all breakpoints

2. **Vehicle Assessment Share Page** (`app/share/assessment/[token]/page.tsx`)
   - Converted from static HTML to Next.js page
   - Added mobile-responsive classNames throughout
   - Fixed tooltip overflow on damage markers
   - Changed "TOTAL ESTIMATED REPAIR COST:" to "TOTAL ESTIMATED REPAIR COST VARIES:"

3. **Dual Category Boxes**
   - Shows both Category S and Category N side by side
   - Each with description of what the category means
   - Category S: Structural damage - repairable, requires inspection
   - Category N: Non-structural - cosmetic/mechanical only

4. **Updated Recommendation Banner**
   - Title: "REPAIR COSTS OUT-WEIGH VEHICLE VALUE"
   - Subtitle: "From an Insurance Perspective this would be considered a Write-Off"
   - Followed by detailed explanation paragraph

5. **Dashboard Share Links Updated**
   - `app/autow/assessments/page.tsx` - Share link now points to `/share/assessment/${id}`
   - `app/autow/assessments/view/page.tsx` - View Full Report and Share links updated

**Commits:**
- `1597e04` - Add global mobile responsive CSS system
- `25ec12e` - Add dual category boxes (S and N) to assessment report
- `aff09c0` - Update recommendation banner text

**Live URL:** https://booking.autow-services.co.uk/share/assessment/HN14-UWY

### Session: 2026-01-17 - Actions Dropdown & Hamburger Menu

**Features Built:**

1. **Actions Dropdown Pattern (⋮) on All List Pages**
   - Replaced individual action buttons with single ⋮ dropdown menu
   - Consistent pattern across: Vehicle Reports, Invoices, Estimates, Dashboard
   - Click-outside handler closes dropdown
   - State tracked with `openActionMenu` useState
   - Styles: actionsContainer, actionsButton, actionsDropdown, actionMenuItem, actionMenuItemDanger, menuDivider

2. **Vehicle Report Actions Dropdown**
   - View, Send to Customer, Copy Share Link
   - **Create Invoice** (NEW) - navigates to `/autow/invoices/create?vehicle_report_id=X`
   - **Create Estimate** (NEW) - navigates to `/autow/estimates/create?vehicle_report_id=X`
   - Edit (draft only), Delete (red)

3. **Create Invoice/Estimate from Vehicle Reports**
   - Added `vehicle_report_id` query parameter support to create pages
   - Fetches vehicle report data and pre-fills form fields:
     - `customer_name` → `client_name`
     - `customer_email` → `client_email`
     - `customer_phone` → `client_phone`
     - `customer_address` → `client_address`
     - `vehicle_reg` → `vehicle_reg`
     - `vehicle_type_model` → `vehicle_model`

4. **Invoices List Actions Dropdown**
   - View, Edit, Share Link
   - Mark as Paid (conditional: pending)
   - Mark as Unpaid + Job Done (conditional: paid)
   - Delete (red)

5. **Estimates List Actions Dropdown**
   - View, Edit, Share Link
   - Convert to Invoice
   - Delete (red)

6. **Booking Dashboard Actions Dropdown**
   - Create Estimate, Create Invoice
   - Edit, Mark Complete (conditional: confirmed)
   - Delete (red)

7. **Hamburger Navigation Menu (☰) on Dashboard**
   - Replaced individual header buttons with hamburger dropdown
   - ← Menu button stays visible separately
   - Dropdown contains: Jotter, Notes, Assessments, + New Booking
   - State tracked with `navMenuOpen` useState
   - Styles: navMenuContainer, hamburgerBtn, navDropdown, navMenuItem, navMenuItemHighlight

**Files Modified:**
- `app/autow/vehicle-report/page.tsx` - Actions dropdown + Create Invoice/Estimate options
- `app/autow/invoices/page.tsx` - Actions dropdown
- `app/autow/estimates/page.tsx` - Actions dropdown
- `app/autow/invoices/create/page.tsx` - vehicle_report_id param handling
- `app/autow/estimates/create/page.tsx` - vehicle_report_id param handling
- `app/autow/dashboard/page.tsx` - Actions dropdown on cards + hamburger nav menu

**Commits:**
- `7a10b27` - Add Actions dropdown and Create Invoice/Estimate from Vehicle Reports
- `f6837b3` - Add Actions dropdown to Booking Dashboard
- `6791172` - Add hamburger navigation menu to Booking Dashboard

**Deployed to:** https://booking.autow-services.co.uk

---

## Future Enhancements

Documented opportunities (no immediate plans):
1. Google Calendar integration (schema ready)
2. Email notifications (nodemailer installed)
3. n8n workflow automation
4. Multi-user support with roles
5. Customer-facing portal (separate app)
6. Payment processing
7. Reporting and analytics
8. SMS notifications
9. Mobile app version
10. Advanced scheduling (recurring bookings, etc.)
11. Assessment database storage (currently static)
12. Assessment photo upload and annotation
13. PDF export for assessments
14. Assessment creation wizard
