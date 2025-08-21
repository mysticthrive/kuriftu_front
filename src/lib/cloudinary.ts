import { Cloudinary } from '@cloudinary/url-gen';

// Cloudinary configuration
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duz3cwxxz'
  }
});

// Upload preset for unsigned uploads
export const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kuriftu_room_images';

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duz3cwxxz'}/image/upload`;

// Function to upload image to Cloudinary
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'kuriftu/room-images');

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

// Function to optimize image URL for different sizes
export const getOptimizedImageUrl = (originalUrl: string, width: number = 800, height: number = 600): string => {
  if (!originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  // Transform the URL to get optimized version
  const url = new URL(originalUrl);
  const pathParts = url.pathname.split('/');
  const uploadIndex = pathParts.findIndex(part => part === 'upload');
  
  if (uploadIndex !== -1) {
    pathParts.splice(uploadIndex + 1, 0, `w_${width},h_${height},c_fill,q_auto,f_auto`);
    url.pathname = pathParts.join('/');
  }

  return url.toString();
};

// Function to get thumbnail URL
export const getThumbnailUrl = (originalUrl: string): string => {
  return getOptimizedImageUrl(originalUrl, 300, 200);
};

// Function to get preview URL
export const getPreviewUrl = (originalUrl: string): string => {
  return getOptimizedImageUrl(originalUrl, 600, 400);
};
