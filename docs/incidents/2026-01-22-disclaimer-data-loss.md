# Incident Report: Disclaimer Feature Failure & Data Loss

**Date**: 2026-01-22
**Severity**: High
**Status**: Resolved (feature), Unrecoverable (data)

## Summary
The disclaimer feature stopped working with 500 errors. Investigation revealed the database table was missing required columns. Customer's signed disclaimer data was already lost before investigation began.

## Timeline
1. User reported 500 error on `/api/share/disclaimer/68c09dc5-e4b6-4a93-983d-9145fe49cc5a`
2. Investigation found `disclaimers` table existed but was missing columns
3. Query showed table was empty - customer data already gone
4. Added missing columns to fix the API
5. Redeployed to Vercel

## Root Cause
The disclaimer feature was added in commit `5fdb611` (Add disclaimer notice system with customer signature). A migration file was created at `database/migrations/create_disclaimers_table.sql` but **was never applied to the production database**.

When the code was deployed to Vercel, the API routes expected certain columns that didn't exist, causing 500 errors.

## Impact
- Customer's signed disclaimer with token `68c09dc5-e4b6-4a93-983d-9145fe49cc5a` is permanently lost
- User reported the feature was working before (signing, email confirmation) - this suggests the data may have been in a different environment or the table was created and later dropped

## Resolution
1. Added missing columns to `disclaimers` table:
   - `customer_name VARCHAR(255)`
   - `customer_address TEXT`
   - `vehicle_reg VARCHAR(20)`
   - `vehicle_make VARCHAR(100)`
   - `vehicle_model VARCHAR(100)`

2. Created trigger function for `updated_at` auto-update

3. Redeployed to Vercel production

4. Verified Parts Bot tables were NOT affected

## Prevention Measures Implemented
1. **Documented shared database architecture** in CLAUDE.md
2. **Added mandatory migration protocol** requiring:
   - Create migration file
   - Test locally
   - Apply to production via SQL Editor or node script
   - Verify on production
3. **Added incident log** to track future issues
4. **Updated global CLAUDE.md** to clarify database is shared

## Database Architecture
The Supabase database `kctnocfwcomphprybnud` is **SHARED** between:
- **AUTOW Booking System** (this project)
- **AUTOW Parts Bot** (separate project)

Tables must be carefully managed to avoid cross-project issues.

## Lessons Learned
1. Migration files are NOT automatically applied - must be manually run on production
2. Always verify database state after deploying new features
3. Document shared infrastructure clearly
4. Consider implementing CI/CD for database migrations

## Files Modified
- `CLAUDE.md` - Added database warning, migration protocol, incident log
- `~/.claude/CLAUDE.md` - Updated global database documentation

## Commits
- `991530f` - Document shared database warning and migration protocol
