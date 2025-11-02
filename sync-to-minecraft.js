#!/usr/bin/env node

/**
 * Sync R2 file metadata to Minecraft Database
 * 
 * This script fetches files from Cloudflare R2 and syncs their metadata
 * to the Minecraft database in vertically organized regions.
 */

const fetch = require('node-fetch');

// Configuration
const BACKEND_API = 'http://localhost:3001';
const MINECRAFT_BRIDGE = 'http://localhost:3002';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function syncReels() {
  console.log(`\n${colors.blue}📹 Syncing Reels to Minecraft (Y: 5-100)...${colors.reset}`);
  
  try {
    // Fetch reels from R2
    console.log(`${colors.cyan}Fetching reels from R2...${colors.reset}`);
    const r2Response = await fetch(`${BACKEND_API}/list-files?folder=reels`);
    const r2Data = await r2Response.json();
    
    if (!r2Data.success) {
      throw new Error('Failed to fetch reels from R2');
    }
    
    // Filter out the folder marker
    const reelFiles = r2Data.files.filter(f => f.size > 0 && f.key !== 'reels/');
    
    console.log(`${colors.cyan}Found ${reelFiles.length} reel(s)${colors.reset}`);
    
    if (reelFiles.length === 0) {
      console.log(`${colors.yellow}No reels to sync${colors.reset}`);
      return { success: 0, failed: 0 };
    }
    
    // Sync to Minecraft
    console.log(`${colors.cyan}Syncing to Minecraft database...${colors.reset}`);
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
      console.log(`${colors.green}✅ Successfully synced ${syncData.results.success.length}/${syncData.results.total} reels${colors.reset}`);
      
      if (syncData.results.failed.length > 0) {
        console.log(`${colors.red}❌ Failed to sync ${syncData.results.failed.length} reel(s):${colors.reset}`);
        syncData.results.failed.forEach(f => {
          console.log(`   - ${f.id}: ${f.error}`);
        });
      }
      
      return {
        success: syncData.results.success.length,
        failed: syncData.results.failed.length
      };
    } else {
      throw new Error(syncData.error || 'Unknown sync error');
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error syncing reels: ${error.message}${colors.reset}`);
    return { success: 0, failed: -1 };
  }
}

async function syncLectures() {
  console.log(`\n${colors.blue}🎓 Syncing Lectures to Minecraft (Y: 105-200)...${colors.reset}`);
  
  try {
    // Fetch lectures from R2
    console.log(`${colors.cyan}Fetching lectures from R2...${colors.reset}`);
    const r2Response = await fetch(`${BACKEND_API}/list-files?folder=lectures`);
    const r2Data = await r2Response.json();
    
    if (!r2Data.success) {
      throw new Error('Failed to fetch lectures from R2');
    }
    
    // Filter video files only
    const lectureFiles = r2Data.files.filter(f => 
      f.size > 0 && 
      f.key !== 'lectures/' &&
      (f.key.endsWith('.mp4') || f.key.endsWith('.webm'))
    );
    
    console.log(`${colors.cyan}Found ${lectureFiles.length} lecture(s)${colors.reset}`);
    
    if (lectureFiles.length === 0) {
      console.log(`${colors.yellow}No lectures to sync${colors.reset}`);
      return { success: 0, failed: 0 };
    }
    
    // Load lecture metadata from frontend (if available)
    const lecturesData = [
      {
        fileName: "DE Intro.mp4",
        title: "Data Engineering Introduction",
        module: "Data Engineering",
        instructor: "Chris Rogers",
        duration: "45:32",
        thumbnail: "/lecture-1.jpg",
        description: "Introduction to data engineering concepts and methodologies."
      }
    ];
    
    // Sync to Minecraft
    console.log(`${colors.cyan}Syncing to Minecraft database...${colors.reset}`);
    const syncResponse = await fetch(`${MINECRAFT_BRIDGE}/mcdb/lectures/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        r2Files: lectureFiles,
        lecturesData: lecturesData
      })
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log(`${colors.green}✅ Successfully synced ${syncData.results.success.length}/${syncData.results.total} lectures${colors.reset}`);
      
      if (syncData.results.failed.length > 0) {
        console.log(`${colors.red}❌ Failed to sync ${syncData.results.failed.length} lecture(s):${colors.reset}`);
        syncData.results.failed.forEach(f => {
          console.log(`   - ${f.id}: ${f.error}`);
        });
      }
      
      return {
        success: syncData.results.success.length,
        failed: syncData.results.failed.length
      };
    } else {
      throw new Error(syncData.error || 'Unknown sync error');
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error syncing lectures: ${error.message}${colors.reset}`);
    return { success: 0, failed: -1 };
  }
}

async function checkServices() {
  console.log(`${colors.blue}🔍 Checking services...${colors.reset}`);
  
  try {
    // Check Backend API
    const backendResponse = await fetch(`${BACKEND_API}/r2-health`);
    const backendData = await backendResponse.json();
    
    if (backendData.success) {
      console.log(`${colors.green}✅ Backend API: Connected to R2${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Backend API: R2 connection failed${colors.reset}`);
      return false;
    }
    
    // Check Minecraft Bridge
    const bridgeResponse = await fetch(`${MINECRAFT_BRIDGE}/health`);
    const bridgeData = await bridgeResponse.json();
    
    if (bridgeData.status === 'connected') {
      console.log(`${colors.green}✅ Minecraft Bridge: Connected${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Minecraft Bridge: Disconnected${colors.reset}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Service check failed: ${error.message}${colors.reset}`);
    console.log(`\n${colors.yellow}Make sure these services are running:${colors.reset}`);
    console.log(`  1. Backend API (port 3001): cd backend && npm start`);
    console.log(`  2. Minecraft Bridge (port 3002): cd minecraft-database/bridge-server && npm start`);
    console.log(`  3. Minecraft Server with database plugin`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║    Minecraft Database Sync Tool              ║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║  Syncs R2 file metadata to Minecraft DB      ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}`);
  
  // Check if services are available
  const servicesReady = await checkServices();
  
  if (!servicesReady) {
    process.exit(1);
  }
  
  // Sync reels and lectures
  const reelResults = await syncReels();
  const lectureResults = await syncLectures();
  
  // Summary
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              Sync Summary                    ║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║  Reels:    ${reelResults.success} synced, ${reelResults.failed} failed           ║${colors.reset}`);
  console.log(`${colors.cyan}║  Lectures: ${lectureResults.success} synced, ${lectureResults.failed} failed           ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  if (reelResults.failed > 0 || lectureResults.failed > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

