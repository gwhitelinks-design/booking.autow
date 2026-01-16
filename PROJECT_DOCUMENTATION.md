# AUTOW BOOKING SYSTEM - COMPLETE PROJECT DOCUMENTATION

**Document Version:** 1.0
**Last Updated:** 2026-01-16
**Total Commits:** 93+
**Project Start:** December 2025

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Directory Structure](#directory-structure)
6. [Database Schema](#database-schema)
7. [All Routes & Pages](#all-routes--pages)
8. [All API Endpoints](#all-api-endpoints)
9. [Features by Module](#features-by-module)
10. [External Integrations](#external-integrations)
11. [Environment Variables](#environment-variables)
12. [Development Timeline](#development-timeline)
13. [Session Log: January 2026](#session-log-january-2026)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)
16. [Future Roadmap](#future-roadmap)

---

## EXECUTIVE SUMMARY

The **AUTOW Booking System** is a comprehensive business management platform built for AUTOW Services LTD, a mobile mechanic and vehicle recovery company based in Cornwall, UK. The system provides end-to-end management of bookings, estimates, invoices, vehicle assessments, receipts, expenses, mileage tracking, and tax calculations.

### Key Statistics

| Metric | Value |
|--------|-------|
| **Total Pages** | 30+ staff pages + 4 public pages |
| **API Endpoints** | 65+ routes |
| **Database Tables** | 18+ tables |
| **External Integrations** | 6 (Telegram, Google Drive, OpenAI, Gemini, Puppeteer, Supabase) |
| **Total Commits** | 93+ |
| **Lines of Code** | ~20,000+ |

### Live URLs

- **Production:** https://booking.autow-services.co.uk
- **Repository:** https://github.com/AU-TOW/booking.autow.git
- **Database:** Supabase (eu-north-1)

---

## PROJECT OVERVIEW

### Business Context

AUTOW Services LTD provides:
- Mobile Mechanic Services
- Garage Services
- Vehicle Recovery
- ECU Remapping

The booking system replaces paper-based processes with a fully digital workflow:

```
Customer Call → Booking → Estimate → Invoice → Payment → Receipt Storage → Tax Summary
```

### Core Workflows

1. **Booking Management**
   - Customer calls → Staff creates booking
   - Telegram notification sent
   - Booking appears on dashboard

2. **Estimate → Invoice Flow**
   - Create estimate with line items
   - Send share link to customer
   - Customer accepts estimate
   - One-click convert to invoice
   - Mark as paid when complete

3. **Smart Jotter Flow**
   - Staff takes photo of handwritten note
   - AI extracts customer/vehicle data
   - Save as note or create booking directly

4. **Receipt & Expense Tracking**
   - Upload receipt photo
   - AI parses supplier, amount, date
   - Stored in Google Drive (monthly folders)
   - Track business expenses by category

5. **Tax Summary**
   - View revenue from paid invoices
   - Deduct expenses and mileage
   - Calculate corporation tax to hold back

---

## TECHNOLOGY STACK

### Core Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **Database** | PostgreSQL (Supabase) | Relational database |
| **Styling** | Inline CSS | Dark theme with green accents |
| **Authentication** | Token-based | localStorage + Bearer tokens |
| **Deployment** | Vercel | Serverless hosting |

### External Services

| Service | Purpose | Library |
|---------|---------|---------|
| **Supabase** | Database hosting | `pg` connection pool |
| **Telegram Bot** | Instant notifications | Custom `lib/telegram.ts` |
| **Google Drive** | Receipt/document storage | `googleapis` |
| **OpenAI Vision** | Smart Jotter OCR | `openai` (GPT-4o-mini) |
| **Gemini Vision** | Receipt parsing | Google AI |
| **Puppeteer** | PDF generation | `puppeteer-core` + `@sparticuz/chromium` |

### Package Dependencies

```json
{
  "@sparticuz/chromium": "^143.0.4",
  "@supabase/supabase-js": "^2.90.1",
  "googleapis": "^131.0.0",
  "next": "^14.2.35",
  "nodemailer": "^6.9.0",
  "openai": "^6.15.0",
  "pg": "^8.11.0",
  "puppeteer-core": "^24.35.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-signature-canvas": "^1.1.0-alpha.2"
}
```

---

## ARCHITECTURE

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Next.js   │  │   API       │  │   Static Assets         │ │
│  │   Pages     │  │   Routes    │  │   (public/)             │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Supabase   │  │   Telegram  │  │   Google    │             │
│  │  PostgreSQL │  │   Bot API   │  │   Drive     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   OpenAI    │  │   Gemini    │                               │
│  │   Vision    │  │   Vision    │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User visits /autow (login page)
2. Enters username/password
3. Server validates against env vars (AUTOW_STAFF_USERNAME/PASSWORD)
4. Server returns AUTOW_STAFF_TOKEN
5. Token stored in localStorage
6. All API calls include Authorization: Bearer <token>
7. Server validates token on each request
```

### Database Connection

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
```

---

## DIRECTORY STRUCTURE

```
autow-booking/
├── app/                              # Next.js App Router
│   ├── api/                         # API Routes
│   │   ├── admin/                   # Admin utilities
│   │   │   ├── fix-my-estimates/
│   │   │   ├── fix-user-ids/
│   │   │   └── run-migration/
│   │   ├── autow/                   # Main API endpoints
│   │   │   ├── auth/login/          # Authentication
│   │   │   ├── booking/             # Booking CRUD
│   │   │   ├── business-hub/        # Financial summaries
│   │   │   │   ├── summary/
│   │   │   │   └── tax-summary/     # Tax calculation
│   │   │   ├── document-number/     # Auto-numbering
│   │   │   ├── drive/               # Google Drive integration
│   │   │   ├── estimate/            # Estimate CRUD
│   │   │   ├── expenses/            # Business expenses
│   │   │   ├── invoice/             # Invoice CRUD
│   │   │   │   └── expense/         # Invoice-linked expenses
│   │   │   ├── jotter/              # Smart Jotter AI
│   │   │   ├── mileage/             # Mileage tracking
│   │   │   ├── note/                # Jotter notes
│   │   │   ├── receipt/             # Receipt management
│   │   │   └── vehicle-report/      # Vehicle reports
│   │   ├── share/                   # Public share endpoints
│   │   └── test-env/                # Environment testing
│   ├── autow/                       # Staff application pages
│   │   ├── assessments/             # Vehicle damage assessments
│   │   ├── booking/                 # New booking form
│   │   ├── business-hub/            # Financial management
│   │   │   ├── expenses/
│   │   │   ├── invoices/
│   │   │   ├── mileage/
│   │   │   ├── receipts/
│   │   │   └── tax-summary/         # Tax calculator (NEW)
│   │   ├── dashboard/               # Main dashboard
│   │   ├── edit/                    # Edit booking
│   │   ├── estimates/               # Estimate management
│   │   ├── invoices/                # Invoice management
│   │   ├── jotter/                  # Smart Jotter OCR
│   │   ├── notes/                   # Jotter notes
│   │   ├── receipts/                # Receipt management
│   │   ├── vehicle-report/          # Vehicle condition reports
│   │   ├── welcome/                 # Welcome menu
│   │   ├── layout.tsx               # Staff app layout
│   │   └── page.tsx                 # Login page
│   ├── share/                       # Public share pages
│   │   ├── assessment/[token]/
│   │   ├── estimate/[token]/
│   │   ├── invoice/[token]/
│   │   ├── vehicle-report/[token]/
│   │   └── layout.tsx
│   ├── globals.css                  # Global responsive CSS
│   ├── layout.tsx                   # Root layout with metadata
│   └── page.tsx                     # Root landing
├── components/                      # React components
│   └── smart-jotter/
│       └── SmartJotter.tsx          # OCR component
├── database/                        # Database schemas
│   ├── schema.sql                   # Core bookings
│   ├── estimates-invoices-schema.sql
│   ├── damage_assessments_schema.sql
│   ├── add-document-numbers.sql
│   ├── add-share-tokens.sql
│   └── migrations/
│       ├── business_hub_tables.sql
│       ├── create_invoice_expenses_table.sql
│       ├── vehicle_based_document_numbers.sql
│       ├── vehicle_reports.sql
│       └── add_gdrive_columns.sql
├── migrations/                      # Additional migrations
│   ├── create_jotter_notes_table.sql
│   └── create_receipts_table.sql
├── lib/                             # Utility libraries
│   ├── db.ts                        # Database connection
│   ├── types.ts                     # TypeScript interfaces
│   ├── telegram.ts                  # Telegram notifications
│   ├── google-drive.ts              # Google Drive API
│   ├── pdf-generator.ts             # PDF generation
│   ├── autow-email.ts               # Email utilities
│   └── supabase-storage.ts          # Storage helper
├── public/                          # Static assets
│   ├── og-image.png                 # Social media image
│   ├── favicon.ico                  # Browser icon
│   ├── apple-touch-icon.png         # iOS icon
│   └── latest2.png                  # AUTOW logo
├── types/                           # Additional types
│   └── smart-jotter.ts
├── .env.example                     # Environment template
├── .env.local                       # Local config (gitignored)
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.mjs                  # Next.js config
├── CLAUDE.md                        # Project instructions
├── BRANDING_SETUP.md                # Branding guide
├── DEPLOYMENT.md                    # Deployment guide
├── INVOICE_MODAL_UPDATE.md          # Feature docs
└── PROJECT_DOCUMENTATION.md         # This file
```

---

## DATABASE SCHEMA

### Core Tables

#### `bookings`
Primary table for job bookings.

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booked_by VARCHAR(255),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_reg VARCHAR(20) NOT NULL,
  location_address TEXT,
  location_postcode VARCHAR(20),
  issue_description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'confirmed',
  estimated_duration INTEGER DEFAULT 90,
  calendar_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Service Types:** Mobile Mechanic, Garage Service, Vehicle Recovery, ECU Remapping
**Status Values:** confirmed, completed, cancelled

#### `estimates`
Quote documents for customers.

```sql
CREATE TABLE estimates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  estimate_number VARCHAR(50) UNIQUE,
  estimate_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_address TEXT,
  client_phone VARCHAR(50),
  client_mobile VARCHAR(50),
  client_fax VARCHAR(50),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_reg VARCHAR(20),
  subtotal DECIMAL(10,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 20,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  signature_data TEXT,
  share_token UUID UNIQUE,
  booking_id INTEGER REFERENCES bookings(id),
  invoice_id INTEGER,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP
);
```

**Estimate Number Format:** Based on vehicle reg (e.g., UWY001, UWY002)
**Status Values:** draft, sent, accepted, declined, converted

#### `invoices`
Billing documents.

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_address TEXT,
  client_phone VARCHAR(50),
  client_mobile VARCHAR(50),
  client_fax VARCHAR(50),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_reg VARCHAR(20),
  subtotal DECIMAL(10,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 20,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_date DATE,
  payment_reference VARCHAR(100),
  bank_account_name VARCHAR(100),
  bank_sort_code VARCHAR(20),
  bank_account_number VARCHAR(20),
  bank_account_type VARCHAR(20),
  notes TEXT,
  signature_data TEXT,
  share_token UUID UNIQUE,
  estimate_id INTEGER REFERENCES estimates(id),
  booking_id INTEGER REFERENCES bookings(id),
  gdrive_folder_id VARCHAR(255),
  gdrive_folder_url TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  paid_at TIMESTAMP
);
```

**Invoice Number Format:** INV-{VehicleReg}{SequentialNumber} (e.g., INV-UWY0001)
**Status Values:** pending, paid, overdue, cancelled

#### `line_items`
Shared items for estimates and invoices.

```sql
CREATE TABLE line_items (
  id SERIAL PRIMARY KEY,
  document_type VARCHAR(20) NOT NULL,
  document_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  item_type VARCHAR(50) DEFAULT 'service',
  rate DECIMAL(10,2) DEFAULT 0,
  quantity DECIMAL(10,2) DEFAULT 1,
  amount DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Document Type:** 'estimate' or 'invoice'
**Item Types:** service, part, labor, other, discount

#### `business_settings`
Company information for documents.

```sql
CREATE TABLE business_settings (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255) DEFAULT 'AUTOW SERVICES LTD',
  business_email VARCHAR(255),
  business_address TEXT,
  business_phone VARCHAR(50),
  business_website VARCHAR(255),
  owner_name VARCHAR(255),
  workshop_location TEXT,
  vat_number VARCHAR(50),
  bank_account_name VARCHAR(100),
  bank_sort_code VARCHAR(20),
  bank_account_number VARCHAR(20),
  bank_account_type VARCHAR(20),
  default_estimate_notes TEXT,
  default_invoice_notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Notes & Jotter Tables

#### `jotter_notes`
Smart Jotter AI-parsed notes.

```sql
CREATE TABLE jotter_notes (
  id SERIAL PRIMARY KEY,
  note_number VARCHAR(50),
  note_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'draft',
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_reg VARCHAR(20),
  vehicle_year VARCHAR(10),
  issue_description TEXT,
  notes TEXT,
  raw_input TEXT,
  confidence_score DECIMAL(3,2),
  booking_id INTEGER REFERENCES bookings(id),
  estimate_id INTEGER REFERENCES estimates(id),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_at TIMESTAMP
);
```

**Note Number Format:** JN-YYYYMMDD-XXX
**Status Values:** draft, active, converted

### Receipt & Expense Tables

#### `receipts`
Business receipt images and metadata.

```sql
CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  receipt_number VARCHAR(50),
  receipt_date DATE,
  supplier VARCHAR(255),
  description TEXT,
  amount DECIMAL(10,2),
  category VARCHAR(50),
  gdrive_file_id VARCHAR(255),
  gdrive_file_url TEXT,
  gdrive_folder_path VARCHAR(255),
  original_filename VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Categories:** fuel, parts, tools, supplies, misc
**Receipt Number Format:** REC-YYYYMMDD-XXX

#### `business_expenses`
Business expense tracking.

```sql
CREATE TABLE business_expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  description VARCHAR(255),
  supplier VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  vat DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  tax_deductible_percent INTEGER DEFAULT 100,
  allowable_for_tax BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Expense Categories:**
- VEHICLES - FINANCE
- VEHICLES - RUNNING
- INSURANCE
- PREMISES
- COMMUNICATIONS
- CLOTHING & PPE
- TOOLS & EQUIPMENT
- CONSUMABLES
- PROFESSIONAL
- STAFF

#### `business_mileage`
HMRC-compliant mileage tracking.

```sql
CREATE TABLE business_mileage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  date DATE NOT NULL,
  vehicle VARCHAR(50),
  start_postcode VARCHAR(20),
  end_postcode VARCHAR(20),
  start_location VARCHAR(255),
  destination VARCHAR(255),
  purpose VARCHAR(255),
  miles DECIMAL(10,2) NOT NULL,
  claim_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**HMRC Rates (2025/26):**
- First 10,000 miles: 45p per mile
- After 10,000 miles: 25p per mile

### Assessment & Report Tables

#### `damage_assessments`
Vehicle damage assessment reports.

```sql
CREATE TABLE damage_assessments (
  id SERIAL PRIMARY KEY,
  vehicle_reg VARCHAR(20),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_engine VARCHAR(100),
  vehicle_colour VARCHAR(50),
  first_registered DATE,
  mot_status VARCHAR(50),
  tax_status VARCHAR(50),
  assessment_date DATE,
  assessor_name VARCHAR(255),
  video_url TEXT,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  critical_issues JSONB,
  damage_items JSONB,
  cost_estimates JSONB,
  repair_cost_min DECIMAL(10,2),
  repair_cost_max DECIMAL(10,2),
  vehicle_value_min DECIMAL(10,2),
  vehicle_value_max DECIMAL(10,2),
  recommendation VARCHAR(100),
  write_off_category VARCHAR(20),
  recommendation_notes TEXT,
  notes TEXT,
  share_token UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Write-Off Categories:**
- Category A: Total destruction
- Category B: Body shell must be crushed
- Category S: Structural damage (repairable)
- Category N: Non-structural damage

#### `vehicle_reports`
Vehicle condition/check reports.

```sql
CREATE TABLE vehicle_reports (
  id SERIAL PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE,
  report_date DATE DEFAULT CURRENT_DATE,
  service_type VARCHAR(50),
  vehicle_reg VARCHAR(20),
  vehicle_type_model VARCHAR(100),
  vehicle_weight VARCHAR(50),
  pickup_location TEXT,
  delivery_location TEXT,
  arrival_time TIME,
  departure_time TIME,
  customer_name VARCHAR(255),
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  known_issues TEXT,
  risk_procedure_description TEXT,
  risk_procedure_signature TEXT,
  damage_markers JSONB,
  notes TEXT,
  video_file_code VARCHAR(255),
  customer_signature TEXT,
  customer_signature_date DATE,
  driver_signature TEXT,
  driver_signature_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  share_token UUID UNIQUE,
  booking_id INTEGER REFERENCES bookings(id),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Report Number Format:** VCR-0001, VCR-0002, etc.
**Service Types:** repair, recovery

---

## ALL ROUTES & PAGES

### Staff Application (`/autow/*`)

All routes require authentication token.

| Route | Page | Description |
|-------|------|-------------|
| `/autow` | Login | Staff login page |
| `/autow/welcome` | Welcome Menu | Main navigation menu |
| `/autow/dashboard` | Dashboard | View all bookings |
| `/autow/booking` | New Booking | Create booking form |
| `/autow/edit?id=X` | Edit Booking | Modify existing booking |
| `/autow/estimates` | Estimates List | All estimates |
| `/autow/estimates/create` | New Estimate | Create estimate |
| `/autow/estimates/edit?id=X` | Edit Estimate | Modify estimate |
| `/autow/estimates/view?id=X` | View Estimate | Estimate details |
| `/autow/invoices` | Invoices List | All invoices |
| `/autow/invoices/create` | New Invoice | Create invoice |
| `/autow/invoices/edit?id=X` | Edit Invoice | Modify invoice |
| `/autow/invoices/view?id=X` | View Invoice | Invoice details |
| `/autow/jotter` | Smart Jotter | AI OCR input |
| `/autow/notes` | Notes List | All jotter notes |
| `/autow/notes/view?id=X` | View Note | Note details |
| `/autow/notes/edit?id=X` | Edit Note | Modify note |
| `/autow/receipts` | Receipts List | All receipts |
| `/autow/receipts/upload` | Upload Receipt | Camera/file upload |
| `/autow/business-hub` | Business Hub | Financial dashboard |
| `/autow/business-hub/invoices` | Invoice Summary | Paid invoice analytics |
| `/autow/business-hub/expenses` | Expenses | Track business expenses |
| `/autow/business-hub/mileage` | Mileage | HMRC mileage tracking |
| `/autow/business-hub/receipts` | Receipt Summary | Receipt management |
| `/autow/business-hub/tax-summary` | **Tax Summary** | Corporation tax calculator |
| `/autow/assessments` | Assessments List | Vehicle damage assessments |
| `/autow/assessments/view?id=X` | View Assessment | Assessment details |
| `/autow/vehicle-report` | Vehicle Reports | List all reports |
| `/autow/vehicle-report/create` | New Report | Create vehicle report |
| `/autow/vehicle-report/view?id=X` | View Report | Report details |

### Public Share Pages (`/share/*`)

No authentication required. UUID tokens for security.

| Route | Description |
|-------|-------------|
| `/share/estimate/[token]` | Public estimate view |
| `/share/invoice/[token]` | Public invoice view |
| `/share/assessment/[token]` | Public damage assessment |
| `/share/vehicle-report/[token]` | Public vehicle report |

---

## ALL API ENDPOINTS

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/auth/login` | Staff login |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/booking/create` | Create booking |
| GET | `/api/autow/booking/list` | List all bookings |
| GET | `/api/autow/booking/get?id=X` | Get single booking |
| POST | `/api/autow/booking/update` | Update booking |
| POST | `/api/autow/booking/complete` | Mark completed |
| POST | `/api/autow/booking/delete` | Delete booking |

### Estimates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/estimate/create` | Create estimate |
| GET | `/api/autow/estimate/list` | List estimates |
| GET | `/api/autow/estimate/get?id=X` | Get estimate |
| POST | `/api/autow/estimate/update` | Update estimate |
| POST | `/api/autow/estimate/delete` | Delete estimate |
| POST | `/api/autow/estimate/generate-share-link` | Create share link |
| POST | `/api/autow/estimate/convert-to-invoice` | Convert to invoice |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/invoice/create` | Create invoice |
| GET | `/api/autow/invoice/list` | List invoices |
| GET | `/api/autow/invoice/get?id=X` | Get invoice |
| POST | `/api/autow/invoice/update` | Update invoice |
| POST | `/api/autow/invoice/delete` | Delete invoice |
| POST | `/api/autow/invoice/mark-as-paid` | Mark as paid |
| POST | `/api/autow/invoice/mark-as-unpaid` | Mark as unpaid |
| POST | `/api/autow/invoice/generate-share-link` | Create share link |

### Invoice Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/invoice/expense/create` | Add expense |
| GET | `/api/autow/invoice/expense/list` | List expenses |
| POST | `/api/autow/invoice/expense/delete` | Delete expense |
| POST | `/api/autow/invoice/expense/parse` | AI OCR parse |

### Smart Jotter

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/jotter/parse` | Parse with OpenAI Vision |
| POST | `/api/autow/jotter/recognize` | OCR recognition |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/note/create` | Create note |
| GET | `/api/autow/note/list` | List notes |
| GET | `/api/autow/note/get?id=X` | Get note |
| POST | `/api/autow/note/update` | Update note |
| POST | `/api/autow/note/delete` | Delete note |
| POST | `/api/autow/note/convert-to-booking` | Convert to booking |

### Receipts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/receipt/upload` | Upload to Google Drive |
| GET | `/api/autow/receipt/list` | List receipts |
| GET | `/api/autow/receipt/get?id=X` | Get receipt |
| POST | `/api/autow/receipt/delete` | Delete receipt |
| POST | `/api/autow/receipt/parse` | AI parse receipt |

### Business Hub

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/autow/business-hub/summary` | Financial summary |
| GET | `/api/autow/business-hub/tax-summary` | **Tax calculation** |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/expenses/create` | Create expense |
| GET | `/api/autow/expenses/list` | List expenses |
| POST | `/api/autow/expenses/delete` | Delete expense |

### Mileage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/mileage/create` | Create entry |
| GET | `/api/autow/mileage/list` | List entries |
| POST | `/api/autow/mileage/delete` | Delete entry |
| POST | `/api/autow/mileage/calculate-distance` | Calculate distance |

### Vehicle Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/autow/vehicle-report/create` | Create report |
| GET | `/api/autow/vehicle-report/list` | List reports |
| GET | `/api/autow/vehicle-report/get?id=X` | Get report |
| POST | `/api/autow/vehicle-report/update` | Update report |
| POST | `/api/autow/vehicle-report/delete` | Delete report |
| POST | `/api/autow/vehicle-report/generate-share-link` | Create share link |
| POST | `/api/autow/vehicle-report/send` | Send via email |

### Public Share

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/share/estimate/[token]` | Get estimate (triggers notification) |
| GET | `/api/share/invoice/[token]` | Get invoice (triggers notification) |

---

## FEATURES BY MODULE

### 1. Booking Management

- Create bookings with customer & vehicle details
- Four service types supported
- Availability checking (prevents double-booking)
- Estimated duration tracking
- Status management (confirmed → completed/cancelled)
- Telegram notifications on creation
- Auto-uppercase for vehicle reg and postcode

### 2. Estimates

- Full CRUD operations
- Client and vehicle information
- Line items: service, part, labor, other, discount
- Auto-calculate subtotal, VAT (20%), total
- Discount modes: flat rate or percentage
- Status tracking (draft → sent → accepted → converted)
- Share links with UUID tokens
- One-click convert to invoice
- Customer signature support

### 3. Invoices

- Similar to estimates
- Payment tracking (amount_paid, balance_due)
- Due date tracking
- Mark as paid/unpaid
- Google Drive folder integration
- PDF generation capability
- Bank details display

### 4. Smart Jotter

- Camera capture
- Image file upload
- Drawing canvas (touch/mouse)
- Text input
- OpenAI Vision OCR (GPT-4o-mini)
- Extracts: customer name, phone, email, vehicle details, issue
- Confidence score display
- Quick actions: Save as Note, Create Booking

### 5. Notes System

- List with status filters
- Full CRUD operations
- Freeform jot area
- Collapsible structured fields
- Convert to booking
- Auto-generated note numbers

### 6. Receipts

- Camera/file upload
- Google Drive storage (monthly folders)
- AI OCR parsing (Gemini Vision)
- Category filtering (fuel, parts, tools, supplies, misc)
- Month filtering
- View in Drive link

### 7. Business Hub

- Financial summary dashboard
- Paid invoice analytics
- Expense tracking by category
- HMRC mileage tracking (45p/25p rates)
- Receipt management
- **Tax Summary** (NEW) - Corporation tax calculator

### 8. Tax Summary (NEW - This Session)

- Period selector: Week, Month, Quarter, Tax Year
- Revenue from paid invoices (minus VAT)
- Deductible expenses
- HMRC mileage claims
- Gross profit calculation
- Corporation tax estimation (19%/25% rates)
- VAT liability summary
- Weekly breakdown
- Expenses by category
- Click for detailed tables

### 9. Vehicle Damage Assessments

- Comprehensive damage reports
- Critical alerts banner
- Categorized findings
- Interactive damage map
- Cost estimates
- Write-off category recommendations
- Public share links

### 10. Vehicle Reports

- Condition/check reports
- Service type (repair/recovery)
- Pickup/delivery locations
- Times and durations
- Known issues
- Risk procedure signatures
- Damage markers on diagram
- Customer/driver signatures
- Email sending
- Public share links

---

## EXTERNAL INTEGRATIONS

### 1. Telegram Bot

**Purpose:** Instant notifications for bookings and share link views.

**Configuration:**
```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

**Notification Types:**
- New booking created
- Customer views estimate share link
- Customer views invoice share link

### 2. Google Drive

**Purpose:** Receipt and document storage.

**Configuration:**
```env
GOOGLE_DRIVE_FOLDER_ID=root-folder-id
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Features:**
- Monthly folder organization (YYYY-MM)
- Invoice folders per vehicle/client
- Public read permissions for view links
- Auto-generated filenames

### 3. OpenAI Vision

**Purpose:** Smart Jotter OCR.

**Configuration:**
```env
OPENAI_API_KEY=sk-...
```

**Model:** GPT-4o-mini (vision)

**Extracts:**
- Customer name, phone, email
- Vehicle make, model, registration, year
- Issue description

### 4. Gemini Vision

**Purpose:** Receipt OCR parsing.

**Extracts:**
- Date
- Supplier
- Amount
- Category
- Description

### 5. Puppeteer

**Purpose:** PDF generation from share pages.

**Libraries:**
- `puppeteer-core`
- `@sparticuz/chromium` (for Vercel serverless)

### 6. Supabase

**Purpose:** PostgreSQL database hosting.

**Configuration:**
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

---

## ENVIRONMENT VARIABLES

### Required

```env
DATABASE_URL=postgresql://user:pass@host:port/db
AUTOW_STAFF_USERNAME=admin
AUTOW_STAFF_PASSWORD=secure-password
AUTOW_STAFF_TOKEN=64-character-secure-token
NEXT_PUBLIC_APP_URL=https://booking.autow-services.co.uk
NODE_ENV=production
```

### Telegram (Active)

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Google Drive (Active)

```env
GOOGLE_DRIVE_FOLDER_ID=root-folder-id
GOOGLE_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### OpenAI (Active)

```env
OPENAI_API_KEY=sk-...
```

### Email (Active)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@autow-services.co.uk
SMTP_PASSWORD=app-specific-password
EMAIL_FROM=AUTOW Services <support@autow-services.co.uk>
```

---

## DEVELOPMENT TIMELINE

### December 2025 - Project Foundation

- Initial project setup
- Next.js 14 App Router configuration
- Database schema design
- Booking CRUD implementation
- Telegram notifications
- Basic authentication

### January 2026 - Feature Expansion

#### Week 1 (Jan 1-5)
- Global mobile responsive CSS system
- Vehicle damage assessments
- Smart Jotter AI OCR
- Notes system with CRUD
- Discount feature (flat rate & percentage)

#### Week 2 (Jan 6-10)
- Receipts system with Google Drive
- AI receipt parsing
- Invoice expenses tracking
- Business Hub foundation
- Mileage tracking (HMRC rates)
- Expense tracking by category

#### Week 3 (Jan 11-15)
- Vehicle Reports feature
- Share links for reports
- Email sending for reports
- Mark as unpaid for invoices
- Google Drive invoice folders
- Business Hub improvements

#### Week 4 (Jan 16 - Current)
- **Tax Summary feature**
- Corporation tax calculator
- Revenue vs expenses breakdown
- VAT liability tracking
- Period filtering (week/month/quarter/year)
- Weekly profit breakdown

---

## SESSION LOG: JANUARY 2026

### Session: 2026-01-16 (Current Session)

**Features Built:**

1. **Tax Summary API** (`/api/autow/business-hub/tax-summary`)
   - Period filtering (week, month, quarter, year)
   - Revenue from paid invoices
   - Expense deductions (tax deductible portion)
   - HMRC mileage claims
   - Corporation tax calculation (19%/25%)
   - VAT liability summary
   - Weekly breakdown
   - Category grouping

2. **Tax Summary Page** (`/autow/business-hub/tax-summary`)
   - Period selector buttons
   - Main calculation card
   - Revenue section (total invoiced minus VAT)
   - Deductions section (expenses + mileage)
   - Taxable profit calculation
   - **TAX TO HOLD BACK** highlighted amount
   - Your Take Home summary
   - Quick stats (clickable for details)
   - Expenses by category breakdown
   - Weekly breakdown (for month+ periods)
   - VAT summary
   - Info section explaining calculations

3. **Business Hub Update**
   - Added Tax Summary card (orange theme)
   - Links to new tax calculator

4. **Vehicle Report Updates** (Earlier in session)
   - Delete functionality
   - Email sending with SMTP
   - Updated branding ("AUTOW Services LTD - Vehicle Repair & Recovery")
   - Terms & Conditions section
   - View page matching share page layout
   - SMTP configuration fix (EBADNAME error)

**Commits:**
- `9f4b983` - Fix tax-summary API to use correct auth pattern and db connection
- `b1e6da8` - Add Tax Summary feature for corporation tax calculation
- `5aa056b` - Update vehicle report pages with new branding and T&Cs
- `2a55517` - Add delete functionality to vehicle reports
- `a313642` - Add Vehicle Report feature with share links and email

### Session: 2026-01-15

**Features Built:**
- Vehicle Reports feature complete
- Create, view, list, edit reports
- Share links with public view
- Email sending capability
- Damage markers on vehicle diagram
- Signatures capture
- Google Drive integration improvements

### Session: 2026-01-10

**Features Built:**
- Receipts system with Google Drive
- AI receipt parsing (Gemini Vision)
- Invoice expenses tracking
- OCR integration for expenses

### Session: 2026-01-08

**Features Built:**
- Business Hub foundation
- Invoice summary page
- Expense tracking
- Mileage tracking (HMRC rates)
- Financial summaries

### Session: 2026-01-07

**Features Built:**
- Discount feature for estimates/invoices
- Flat rate and percentage modes
- Edit modal with live preview

### Session: 2026-01-05

**Features Built:**
- Smart Jotter OCR component
- Notes system with CRUD
- Global mobile responsive CSS
- Vehicle damage assessments
- Assessment share pages

---

## DEPLOYMENT

### Platform: Vercel

**Steps:**
1. Push to GitHub repository
2. Import in Vercel dashboard
3. Configure environment variables
4. Deploy (automatic on push)

### Current Deployment

- **URL:** https://booking.autow-services.co.uk
- **Database:** Supabase (eu-north-1)
- **Repository:** https://github.com/AU-TOW/booking.autow.git

### Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Run production locally
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## TROUBLESHOOTING

### Database Connection

- Verify `DATABASE_URL` is correct
- Check Supabase project is not paused
- Ensure SSL mode is enabled

### Authentication

- Clear localStorage and re-login
- Verify `AUTOW_STAFF_TOKEN` matches in env vars

### Telegram Not Sending

- Check bot token and chat ID
- Notifications fail silently
- Check Vercel logs for errors

### Google Drive Upload Fails

- Verify service account credentials
- Check folder permissions
- Ensure private key newlines are correct

### Build Errors

- Run `npm run build` locally first
- Check for TypeScript errors
- Verify all imports are correct

---

## FUTURE ROADMAP

### Planned Features

1. **Job Costing Integration**
   - Link expenses to specific invoices
   - Per-job profitability tracking
   - Automated profit calculation

2. **Google Calendar Integration**
   - Sync bookings with calendar
   - Calendar event IDs already in schema

3. **Customer Portal**
   - Customer login
   - View their estimates/invoices
   - Payment integration

4. **Advanced Reporting**
   - Quarterly reports
   - Year-over-year comparison
   - Export to CSV/PDF

5. **Mobile App**
   - React Native version
   - Offline capability
   - Push notifications

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-16 | Initial comprehensive documentation |

---

**Document Maintained By:** Claude Code AI Assistant
**Last Updated:** 2026-01-16
