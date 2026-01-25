# AUTOW n8n Workflows

## Database Daily Backup Workflow

Automatically backs up the AUTOW database every day at 3 AM and uploads to Google Drive.

### Architecture

```
┌─────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Schedule   │───▶│  HTTP Request  │───▶│    Code      │───▶│ Google Drive │───▶│   Telegram   │
│  Daily 3AM  │    │  Fetch Backup  │    │ Format JSON  │    │   Upload     │    │   Notify     │
└─────────────┘    └────────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                                          │
                   ┌──────────────────────────────────────────────────────────────────────┘
                   │  On Error
                   ▼
            ┌──────────────┐
            │   Telegram   │
            │ Error Notify │
            └──────────────┘
```

### What Gets Backed Up

All AUTOW Booking tables:
- `bookings` - Customer bookings
- `estimates` - Price estimates
- `invoices` - Invoices
- `line_items` - Estimate/invoice line items
- `clients` - Customer database
- `disclaimers` - Risk disclaimer forms
- `jotter_notes` - Smart jotter notes
- `receipts` - Receipt records
- `vehicle_reports` - Vehicle assessment reports
- `mileage_logs` - Mileage tracking
- `expenses` - Business expenses
- `business_settings` - Company settings

**Note**: Parts Bot tables are NOT included (different project, same database).

### Setup Instructions

#### 1. Deploy the API Endpoint

The backup API is already in the codebase:
```
app/api/autow/backup/export/route.ts
```

Deploy to Vercel:
```bash
cd D:\Projects-AI\autow-booking
vercel --prod
```

Test the endpoint:
```bash
curl -H "Authorization: Bearer YOUR_STAFF_TOKEN" \
  https://booking.autow-services.co.uk/api/autow/backup/export
```

#### 2. Import Workflow to n8n

1. Open https://automation.autow-services.co.uk
2. Go to **Workflows** → **Import from File**
3. Select `database-backup-workflow.json`
4. The workflow will be imported but need configuration

#### 3. Configure Credentials

**HTTP Header Auth** (for API access):
1. Go to **Credentials** → **New**
2. Select **Header Auth**
3. Name: `AUTOW API Token`
4. Header Name: `Authorization`
5. Header Value: `Bearer YOUR_STAFF_TOKEN`

**Google Drive** (for uploads):
1. Go to **Credentials** → **New**
2. Select **Google Drive OAuth2**
3. Follow OAuth flow to connect your Google account
4. Create a folder in Google Drive for backups
5. Copy the folder ID from the URL

**Telegram** (for notifications):
1. Go to **Credentials** → **New**
2. Select **Telegram**
3. Enter your bot token (same as TELEGRAM_BOT_TOKEN)
4. Get chat ID using @userinfobot on Telegram

#### 4. Update Workflow Nodes

Edit each node to use correct credentials and IDs:

1. **Fetch Backup Data**: Select your "AUTOW API Token" credential
2. **Upload to Drive**: 
   - Select your Google Drive credential
   - Set folder ID to your backup folder
3. **Telegram Success**: 
   - Select your Telegram credential
   - Set chat ID
4. **Telegram Error**: Same as above

#### 5. Activate Workflow

1. Test by clicking **Execute Workflow** manually
2. Verify backup appears in Google Drive
3. Verify Telegram notification received
4. Toggle **Active** to enable scheduled runs

### Backup File Format

```json
{
  "backup_timestamp": "2026-01-25T03:00:00.000Z",
  "backup_date": "2026-01-25",
  "database": "AUTOW Booking System",
  "database_id": "kctnocfwcomphprybnud",
  "total_records": 1234,
  "table_count": 12,
  "tables": {
    "bookings": {
      "count": 150,
      "data": [...]
    },
    "invoices": {
      "count": 89,
      "data": [...]
    }
    // ... etc
  }
}
```

### Retention

Backups are stored in Google Drive. Recommended retention:
- Keep daily backups for 30 days
- Keep monthly backups for 1 year

You can set up a separate n8n workflow to clean old backups, or use Google Drive's built-in retention policies.

### Troubleshooting

**Backup fails with 401 error**:
- Check the Bearer token in HTTP Header Auth credential
- Ensure it matches AUTOW_STAFF_TOKEN in Vercel env vars

**Backup fails with timeout**:
- Increase timeout in HTTP Request node (default: 60 seconds)
- Large databases may need more time

**Google Drive upload fails**:
- Re-authorize Google Drive credential
- Check folder ID is correct
- Ensure folder hasn't been deleted

**Telegram notification fails**:
- Verify bot token is correct
- Ensure chat ID is numeric (not username)
- Check bot has permission to message the chat

### Environment Variables

Required in Vercel:
- `AUTOW_STAFF_TOKEN` - Used for API authentication

Optional n8n environment variables:
- `GOOGLE_DRIVE_BACKUP_FOLDER_ID` - Backup folder ID
- `TELEGRAM_CHAT_ID` - Notification chat ID

### File Locations

- Workflow JSON: `n8n-workflows/database-backup-workflow.json`
- API Endpoint: `app/api/autow/backup/export/route.ts`
- This README: `n8n-workflows/README.md`
