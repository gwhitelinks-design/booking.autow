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
- Fields: description, item_type (part/service/labor/other), rate, quantity, amount
- Polymorphic: `document_type` (estimate/invoice) + `document_id`
- Supports sorting via `sort_order`

**`business_settings`**
- Company information for documents
- Fields: business_name, email, address, phone, website, owner, workshop_location

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
```

### Optional (placeholders, not implemented)
```env
GOOGLE_CLIENT_EMAIL=...       # For calendar sync
GOOGLE_PRIVATE_KEY=...
GOOGLE_CALENDAR_ID=...
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
- **SSL**: Enabled with `rejectUnauthorized: false` (Supabase uses self-signed certs)
- **Connection Pooling**: Yes, via `pg.Pool` in `lib/db.ts`
- **Query Logging**: All queries logged to console in development

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
  item_type: 'part' | 'service' | 'labor' | 'other';
  rate: number;
  quantity: number;
  amount: number;             // rate * quantity
  sort_order?: number;
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
- **Line Items**: Add multiple items with different types (parts, service, labor, other)
- **Auto-Calculate**: Subtotal, VAT (20%), and total calculated automatically
- **Status Tracking**: Track document lifecycle (draft → sent → accepted/paid)
- **Convert to Invoice**: Estimates can be converted to invoices with one click
- **Mark as Paid**: Invoices can be marked as paid to track payment status

## Critical Files

- `lib/db.ts` - Database connection pool (modify for different database)
- `lib/types.ts` - TypeScript interfaces (modify when schema changes)
- `lib/telegram.ts` - Telegram notification functions (booking + share links)
- `app/autow/layout.tsx` - Custom layout removes default Next.js chrome
- `database/schema.sql` - Complete database schema with functions and indexes
- `.env.local` - Local configuration (never commit this)
- `app/api/autow/booking/create/route.ts` - Booking creation with availability check
- `app/api/share/estimate/[token]/route.ts` - Public estimate viewing with notification
- `app/api/share/invoice/[token]/route.ts` - Public invoice viewing with notification
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
