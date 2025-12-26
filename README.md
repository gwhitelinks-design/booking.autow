# AUTOW Booking System

A Next.js-based booking management system for AUTOW Services, designed for deployment on Vercel.

## Features

- Staff-only login system
- Create new customer bookings
- View all bookings in a comprehensive dashboard
- Edit existing bookings
- Mark bookings as completed
- Delete bookings
- Availability checking
- Mobile-responsive design
- Custom layout without website header/footer

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Deployment**: Vercel
- **Styling**: Inline CSS (no external dependencies)

## Project Structure

```
autow-booking/
├── app/
│   ├── autow/                      # Main booking system (custom layout)
│   │   ├── layout.tsx             # Custom layout without header/footer
│   │   ├── page.tsx               # Login page
│   │   ├── welcome/page.tsx       # Welcome menu
│   │   ├── booking/page.tsx       # New booking form
│   │   ├── dashboard/page.tsx     # Bookings dashboard
│   │   └── edit/page.tsx          # Edit booking form
│   └── api/autow/                 # API routes
│       ├── auth/login/route.ts    # Authentication
│       └── booking/               # Booking operations
│           ├── create/route.ts
│           ├── list/route.ts
│           ├── get/route.ts
│           ├── update/route.ts
│           ├── complete/route.ts
│           └── delete/route.ts
├── lib/
│   ├── db.ts                      # Database connection
│   ├── types.ts                   # TypeScript interfaces
│   └── auth.ts                    # Authentication utilities
├── database/
│   └── schema.sql                 # Database schema
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .env.example
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Vercel account (for deployment)
- Git installed

### 2. Database Setup

1. Create a PostgreSQL database (you can use services like Neon, Supabase, or Vercel Postgres)

2. Run the database schema:

```bash
psql -U your_username -d your_database -f database/schema.sql
```

Or copy the contents of `database/schema.sql` and run it in your database client.

### 3. Local Development Setup

1. Clone or navigate to the project:

```bash
cd /c/autow-booking
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Staff Login Credentials
AUTOW_STAFF_USERNAME=admin
AUTOW_STAFF_PASSWORD=your-secure-password
AUTOW_STAFF_TOKEN=your-secure-token-here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000/autow](http://localhost:3000/autow) in your browser

### 4. Vercel Deployment

#### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

4. Follow the prompts and add your environment variables when asked.

#### Option B: Deploy via Vercel Dashboard

1. Push your code to GitHub:

```bash
cd /c/autow-booking
git init
git add .
git commit -m "Initial commit - AUTOW Booking System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/autow-booking.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

6. Add Environment Variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`:
     - `DATABASE_URL`
     - `AUTOW_STAFF_USERNAME`
     - `AUTOW_STAFF_PASSWORD`
     - `AUTOW_STAFF_TOKEN`
     - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
     - `NODE_ENV` (set to `production`)

7. Deploy!

### 5. Post-Deployment

1. Visit your deployed site at `https://your-project.vercel.app/autow`

2. Login with your staff credentials

3. Test all functionality:
   - Login
   - Create a new booking
   - View dashboard
   - Edit a booking
   - Mark as complete
   - Delete a booking

## Usage

### Accessing the System

1. Navigate to `/autow` on your domain
2. Login with staff credentials
3. Choose "New Booking" or "View Dashboard"

### Default Credentials

Change these immediately in your environment variables:
- **Username**: admin
- **Password**: changeme

### Creating a Booking

1. From the welcome page, click "New Booking"
2. Fill in all required fields:
   - Service type
   - Date and time
   - Customer details
   - Vehicle information
   - Location
   - Issue description
3. Click "Create Booking"

### Managing Bookings

1. From the welcome page, click "View Dashboard"
2. See today's bookings and upcoming bookings
3. Use action buttons:
   - **Edit**: Modify booking details
   - **Complete**: Mark booking as completed
   - **Delete**: Permanently remove booking

## Database Schema

### Bookings Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| booked_by | VARCHAR(255) | Staff member name |
| booking_date | DATE | Date of appointment |
| booking_time | TIME | Time of appointment |
| service_type | VARCHAR(100) | Type of service |
| customer_name | VARCHAR(255) | Customer full name |
| customer_phone | VARCHAR(20) | Customer phone number |
| customer_email | VARCHAR(255) | Customer email (optional) |
| vehicle_make | VARCHAR(100) | Vehicle manufacturer |
| vehicle_model | VARCHAR(100) | Vehicle model |
| vehicle_reg | VARCHAR(20) | Vehicle registration |
| location_address | TEXT | Service location address |
| location_postcode | VARCHAR(20) | Service location postcode |
| issue_description | TEXT | Description of the issue |
| notes | TEXT | Additional notes (optional) |
| status | VARCHAR(50) | confirmed/completed/cancelled |
| estimated_duration | INTEGER | Duration in minutes (default: 90) |
| calendar_event_id | VARCHAR(255) | Google Calendar event ID (optional) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record last update time |

### Functions

- **check_availability(date, time, duration)**: Returns boolean indicating if time slot is available

## Customization

### Changing the Logo

Replace the logo URL in all page files:
```typescript
<img src="https://autow-services.co.uk/logo.png" alt="AUTOW" />
```

### Modifying Service Types

Edit the service type options in:
- `app/autow/booking/page.tsx`
- `app/autow/edit/page.tsx`

### Changing Colors

The primary brand color is `#30ff37` (green). Search and replace to change throughout the app.

## Security Notes

1. Always use strong passwords and tokens
2. Store sensitive credentials in environment variables only
3. Never commit `.env.local` or `.env` to version control
4. Use HTTPS in production (Vercel provides this automatically)
5. Regularly update dependencies: `npm update`

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Ensure your database allows connections from Vercel's IP ranges
- Check if SSL is required (most cloud databases require it)

### Authentication Issues

- Verify environment variables are set in Vercel
- Clear browser localStorage and try logging in again
- Check that `AUTOW_STAFF_TOKEN` matches between login and API routes

### Build Errors

- Run `npm run build` locally to catch errors before deployment
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure all dependencies are in `package.json`

## Support

For issues or questions:
1. Check the database connection
2. Review Vercel deployment logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## License

Proprietary - AUTOW Services

---

Built with Next.js and deployed on Vercel
# booking.autow
