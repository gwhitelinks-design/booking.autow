# AUTOW Services - Branding Setup Guide

This guide explains how to add your logos and images to remove the "Create Next App" branding from shared links.

## Files You Need to Add

All files go in the `public/` folder:

### 1. Open Graph Image (Required for Social Media Sharing)
**File**: `public/og-image.png`
- **Dimensions**: 1200 x 630 pixels
- **Format**: PNG or JPG
- **Purpose**: This image appears when you share links on WhatsApp, Facebook, Twitter, etc.
- **Content**: Should contain your AUTOW Services logo and text

**How to create**:
1. Open your logo in an image editor (Photoshop, Canva, etc.)
2. Create a new canvas: 1200px wide x 630px tall
3. Add your AUTOW logo (centered or left-aligned)
4. Optionally add text: "AUTOW Services - Professional Automotive Services"
5. Use your brand colors (neon green #30ff37 on black background)
6. Export as PNG
7. Save as `og-image.png` in the `public/` folder

**Quick option**: You can use `latest2.png` temporarily:
```bash
# Copy existing logo as Open Graph image (temporary)
cp public/latest2.png public/og-image.png
```

---

### 2. Favicon (Browser Tab Icon)
**File**: `public/favicon.ico`
- **Dimensions**: 32 x 32 pixels (or 16x16, 32x32, 48x48 multi-size)
- **Format**: ICO file
- **Purpose**: Appears in browser tabs, bookmarks, and browser history

**How to create**:
1. Take your AUTOW logo
2. Resize to 32x32 pixels (square)
3. Convert to `.ico` format using a tool like:
   - https://favicon.io/
   - https://convertico.com/
   - Photoshop/GIMP (Save As → ICO)
4. Save as `favicon.ico` in the `public/` folder

---

### 3. Apple Touch Icon (iOS Home Screen)
**File**: `public/apple-touch-icon.png`
- **Dimensions**: 180 x 180 pixels
- **Format**: PNG
- **Purpose**: Appears when users add your website to their iOS home screen

**How to create**:
1. Take your AUTOW logo
2. Resize to 180x180 pixels (square)
3. Add some padding (logo shouldn't touch edges)
4. Export as PNG
5. Save as `apple-touch-icon.png` in the `public/` folder

---

## Current Status

✅ **Code Updated**: Metadata and Open Graph tags are now configured
⚠️ **Images Needed**: You need to add these 3 image files:
- `public/og-image.png` (1200x630) - **Most important for social sharing**
- `public/favicon.ico` (32x32) - Browser tab icon
- `public/apple-touch-icon.png` (180x180) - iOS home screen icon

---

## Quick Setup (Using Existing Logo)

If you want to test immediately, you can temporarily use your existing `latest2.png`:

```bash
# Navigate to public folder
cd C:\autow-booking\public

# Copy existing logo as Open Graph image (will work but not ideal size)
copy latest2.png og-image.png

# For favicon and apple icon, you'll need to convert properly
# Use https://favicon.io/ to upload latest2.png and generate all formats
```

---

## Testing Your Changes

After adding the images:

1. **Build the app**:
   ```bash
   npm run build
   npm start
   ```

2. **Test social sharing**:
   - Create a test invoice/estimate share link
   - Share the link on WhatsApp or use this tool: https://www.opengraph.xyz/
   - You should see:
     - Title: "AUTOW Services - Document"
     - Description: "View your estimate or invoice from AUTOW Services"
     - Image: Your og-image.png (not Vercel logo)
     - No "Create Next App" text

3. **Test browser tab**:
   - Open your site in a browser
   - Check the tab icon (favicon)
   - Should show your AUTOW logo, not default Next.js icon

---

## What Changed in the Code

The following files were updated with proper metadata:

1. **`app/layout.tsx`**: Added complete Open Graph tags, Twitter cards, and metadata
2. **`app/share/layout.tsx`**: Created new layout with share-specific metadata
3. **Metadata includes**:
   - Title: "AUTOW Services"
   - Description: Your business description
   - Open Graph image: `/og-image.png`
   - Favicon references
   - Twitter card support
   - Robots noindex for share pages (keeps them private from Google)

---

## Need Help?

If you need help creating the images:
1. Use Canva (free): https://www.canva.com/
   - Search for "Open Graph" template (1200x630)
   - Add your logo and text
   - Download as PNG

2. Use Favicon Generator: https://favicon.io/
   - Upload your logo
   - Downloads all favicon formats automatically

3. Or hire a designer on Fiverr for £5-10

---

**Last Updated**: 2025-12-31
