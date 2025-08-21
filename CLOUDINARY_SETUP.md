# Cloudinary Setup for Room Type Images

## Overview
This guide will help you set up Cloudinary for image uploads in the Room Type Images feature.

## Prerequisites
1. A Cloudinary account (free tier available)
2. Access to your Cloudinary dashboard

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Note your Cloud Name from the dashboard

### 2. Create Upload Preset
1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set the following:
   - **Preset name**: `kuriftu_room_images`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `kuriftu/room-images`
   - **Allowed formats**: `jpg, png, gif, webp`
   - **Max file size**: `5MB`
5. Click **Save**

### 3. Configure Environment Variables
Create a `.env.local` file in the frontend directory with:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=kuriftu_room_images
```

Replace `your-cloud-name` with your actual Cloudinary cloud name.

### 4. Install Dependencies
```bash
npm install @cloudinary/url-gen
```

## Features

### Image Upload
- Users can select image files directly from their device
- Images are automatically uploaded to Cloudinary
- Optimized versions are generated for different sizes

### Image Optimization
- **Thumbnails**: 300x200px for grid views
- **Previews**: 600x400px for modal previews
- **Full size**: Original resolution for detailed views

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limits
- Maximum file size: 5MB
- Automatic compression and optimization

## Usage

### Adding New Images
1. Click "Add Image" button
2. Select an image file from your device
3. Choose room group and type relationship
4. Add alt text (optional)
5. Set as primary image (optional)
6. Click "Add Image"

### Editing Images
1. Click the edit icon on any image
2. Select a new image file (optional)
3. Update alt text and primary status
4. Click "Update Image"

### Image Preview
- Real-time preview when selecting files
- Optimized loading for better performance
- Fallback for invalid images

## Security
- Unsigned uploads for client-side uploads
- File type validation
- Size limits enforced
- Secure URLs for all images

## Troubleshooting

### Upload Fails
- Check your Cloudinary cloud name
- Verify upload preset exists and is unsigned
- Ensure file size is under 5MB
- Check file format is supported

### Images Not Loading
- Verify environment variables are set correctly
- Check Cloudinary account status
- Ensure upload preset permissions are correct

### Performance Issues
- Images are automatically optimized
- Thumbnails are generated for faster loading
- CDN delivery for global performance
