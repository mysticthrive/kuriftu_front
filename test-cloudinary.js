// Simple test script to verify Cloudinary configuration
// Run this with: node test-cloudinary.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check environment variables
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

console.log('Environment Variables:');
console.log(`✅ Cloud Name: ${cloudName || '❌ NOT SET'}`);
console.log(`✅ Upload Preset: ${uploadPreset || '❌ NOT SET'}`);

if (!cloudName || !uploadPreset) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please check your .env.local file.');
  process.exit(1);
}

// Test Cloudinary URL construction
const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
console.log(`\n✅ Upload URL: ${uploadUrl}`);

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
} else {
  console.log('❌ .env.local file not found');
  console.log('Please copy env.example to .env.local and configure your values.');
}

console.log('\n🎉 Configuration test completed!');
console.log('\nNext steps:');
console.log('1. Create upload preset in Cloudinary dashboard');
console.log('2. Start your development server');
console.log('3. Test image upload in the Room Type Images page');
