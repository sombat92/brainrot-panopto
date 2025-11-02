#!/usr/bin/env node

/**
 * 🎬 Bulk Upload Reels Script
 * 
 * Upload multiple reels from a folder to Cloudflare R2
 * and automatically sync to Minecraft database with brainrot metadata
 * 
 * Usage:
 *   node bulk-upload-reels.js /path/to/reels/folder
 *   node bulk-upload-reels.js ./my-reels
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const BACKEND_API = 'http://localhost:3001';
const MINECRAFT_BRIDGE = 'http://localhost:3002';

// Supported video formats
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.m4v'];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Check if file is a video
 */
function isVideoFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Upload a single file to R2
 */
async function uploadFile(filePath, folder = 'reels') {
  const filename = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
  
  console.log(`${colors.cyan}📤 Uploading: ${filename} (${fileSizeMB} MB)${colors.reset}`);
  
  try {
    // Read file as buffer (raw binary data)
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to R2
    const uploadUrl = `${BACKEND_API}/upload-file?folder=${encodeURIComponent(folder)}&fileName=${encodeURIComponent(filename)}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: fileBuffer,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString()
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`${colors.green}✅ Uploaded: ${filename}${colors.reset}`);
      return { success: true, filename, data };
    } else {
      console.error(`${colors.red}❌ Failed: ${filename} - ${data.error}${colors.reset}`);
      return { success: false, filename, error: data.error };
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${filename} - ${error.message}${colors.reset}`);
    return { success: false, filename, error: error.message };
  }
}

/**
 * Sync uploaded reels to Minecraft
 */
async function syncToMinecraft() {
  console.log(`\n${colors.magenta}🎮 Syncing reels to Minecraft database...${colors.reset}`);
  
  try {
    // Fetch all reels from R2
    const r2Response = await fetch(`${BACKEND_API}/list-files?folder=reels`);
    const r2Data = await r2Response.json();
    
    if (!r2Data.success) {
      throw new Error('Failed to fetch reels from R2');
    }
    
    const reelFiles = r2Data.files.filter(f => f.size > 0 && f.key !== 'reels/');
    
    // Sync to Minecraft
    const syncResponse = await fetch(`${MINECRAFT_BRIDGE}/mcdb/reels/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        r2BaseUrl: BACKEND_API,
        r2Files: reelFiles
      })
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log(`${colors.green}✅ Synced ${syncData.results.success.length}/${syncData.results.total} reels to Minecraft${colors.reset}`);
      return syncData.results.success.length;
    } else {
      throw new Error(syncData.error || 'Unknown sync error');
    }
  } catch (error) {
    console.error(`${colors.red}❌ Sync error: ${error.message}${colors.reset}`);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     🎬 Bulk Reel Upload Script            ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Get folder path from arguments
  const folderPath = process.argv[2];
  
  if (!folderPath) {
    console.error(`${colors.red}❌ Error: No folder path provided${colors.reset}`);
    console.log(`\n${colors.yellow}Usage:${colors.reset}`);
    console.log(`  node bulk-upload-reels.js /path/to/reels/folder`);
    console.log(`  node bulk-upload-reels.js ./my-reels\n`);
    process.exit(1);
  }
  
  // Resolve absolute path
  const absolutePath = path.resolve(folderPath);
  
  // Check if folder exists
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}❌ Error: Folder not found: ${absolutePath}${colors.reset}\n`);
    process.exit(1);
  }
  
  // Check if it's a directory
  const stats = fs.statSync(absolutePath);
  if (!stats.isDirectory()) {
    console.error(`${colors.red}❌ Error: Not a directory: ${absolutePath}${colors.reset}\n`);
    process.exit(1);
  }
  
  console.log(`${colors.cyan}📁 Scanning folder: ${absolutePath}${colors.reset}\n`);
  
  // Read all files from folder
  const files = fs.readdirSync(absolutePath);
  const videoFiles = files.filter(isVideoFile);
  
  if (videoFiles.length === 0) {
    console.log(`${colors.yellow}⚠️  No video files found in folder${colors.reset}`);
    console.log(`${colors.yellow}   Supported formats: ${VIDEO_EXTENSIONS.join(', ')}${colors.reset}\n`);
    process.exit(0);
  }
  
  console.log(`${colors.green}✅ Found ${videoFiles.length} video file(s)${colors.reset}\n`);
  
  // Ask for confirmation
  console.log(`${colors.yellow}Files to upload:${colors.reset}`);
  videoFiles.forEach((file, i) => {
    const filePath = path.join(absolutePath, file);
    const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ${i + 1}. ${file} (${sizeMB} MB)`);
  });
  console.log('');
  
  // Upload all files
  const results = {
    success: [],
    failed: []
  };
  
  for (let i = 0; i < videoFiles.length; i++) {
    const file = videoFiles[i];
    const filePath = path.join(absolutePath, file);
    
    console.log(`${colors.blue}[${i + 1}/${videoFiles.length}]${colors.reset}`);
    const result = await uploadFile(filePath, 'reels');
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Small delay between uploads
    if (i < videoFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Print summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║            Upload Summary                  ║${colors.reset}`);
  console.log(`${colors.blue}╠════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.blue}║${colors.reset}  ${colors.green}✅ Successful: ${results.success.length.toString().padEnd(22)}${colors.reset}${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}║${colors.reset}  ${colors.red}❌ Failed: ${results.failed.length.toString().padEnd(26)}${colors.reset}${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}║${colors.reset}  📊 Total: ${videoFiles.length.toString().padEnd(28)}${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);
  
  if (results.failed.length > 0) {
    console.log(`${colors.red}Failed files:${colors.reset}`);
    results.failed.forEach(f => {
      console.log(`  - ${f.filename}: ${f.error}`);
    });
    console.log('');
  }
  
  // Sync to Minecraft if any uploads succeeded
  if (results.success.length > 0) {
    const synced = await syncToMinecraft();
    console.log(`\n${colors.green}🎉 Upload complete! ${synced} reel(s) synced to Minecraft${colors.reset}`);
    console.log(`${colors.cyan}   View them at: http://localhost:3000/viewer.html${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  No files uploaded successfully${colors.reset}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { uploadFile, syncToMinecraft };

