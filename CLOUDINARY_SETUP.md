# Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" (it's free)
3. Fill in your details and verify your email

## Step 2: Get Your Cloudinary Credentials

1. After signing up, you'll be taken to your Dashboard
2. On the Dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these values - you'll need them in the next step

## Step 3: Set Up Upload Preset (For Unsigned Uploads)

1. In your Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set the following:
   - **Preset name**: `unsigned_upload` (or any name you prefer)
   - **Signing Mode**: Select **Unsigned**
   - **Folder**: `listings` (optional, to organize your uploads)
   - **Allowed formats**: `jpg, png, gif, webp`
   - **Max file size**: `10MB` (or your preference)
5. Click **Save**

## Step 4: Add Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=unsigned_upload
```

Replace:
- `your_cloud_name_here` with your actual Cloud Name from Step 2
- `unsigned_upload` with your preset name from Step 3 (if different)

## Step 5: Restart Your Development Server

After adding the environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## How It Works

- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Direct Uploads**: Photos are uploaded directly from the browser to Cloudinary
- **Automatic Optimization**: Cloudinary automatically optimizes images
- **CDN**: Images are served via Cloudinary's global CDN
- **Transformations**: You can resize, crop, and optimize images on-the-fly

## Security Note

The current setup uses **unsigned uploads** which means the upload preset is public. For production, consider:
- Using signed uploads with a server-side API route
- Setting up upload restrictions (file size, format, etc.) in the preset
- Using folder organization to keep uploads organized

## Troubleshooting

- **"Missing upload preset"**: Make sure you've created the upload preset and the name matches in `.env.local`
- **"Invalid cloud name"**: Double-check your Cloud Name in `.env.local`
- **Upload fails**: Check browser console for error messages
- **Images not showing**: Verify the URLs are being saved correctly to Firestore

