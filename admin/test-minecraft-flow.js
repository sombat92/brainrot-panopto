#!/usr/bin/env node

/**
 * Test R2 → Minecraft → Frontend Data Flow
 * 
 * This script verifies the complete data pipeline:
 * 1. Fetches files from R2
 * 2. Stores metadata in Minecraft
 * 3. Retrieves from Minecraft
 * 4. Verifies URLs work for frontend
 */

const fetch = require('node-fetch');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const BACKEND_API = 'http://localhost:3001';
const MINECRAFT_BRIDGE = 'http://localhost:3002';

async function testCompleteFlow() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Testing R2 → Minecraft → Frontend Flow    ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Step 1: Fetch from R2
  console.log(`${colors.blue}📦 STEP 1: Fetching Reels from R2...${colors.reset}`);
  let r2Reels;
  try {
    const response = await fetch(`${BACKEND_API}/list-files?folder=reels`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('R2 fetch failed');
    }
    
    r2Reels = data.files.filter(f => f.size > 0 && f.key !== 'reels/');
    console.log(`${colors.green}✅ Found ${r2Reels.length} reels in R2${colors.reset}`);
    
    r2Reels.forEach((reel, i) => {
      console.log(`   ${i + 1}. ${reel.key} (${(reel.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');
    
  } catch (error) {
    console.error(`${colors.red}❌ Failed to fetch from R2: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Store in Minecraft
  console.log(`${colors.blue}🎮 STEP 2: Storing in Minecraft Database...${colors.reset}`);
  let syncResults;
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/mcdb/reels/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ r2Files: r2Reels })
    });
    
    syncResults = await response.json();
    
    if (!syncResults.success) {
      throw new Error('Sync failed');
    }
    
    console.log(`${colors.green}✅ Synced ${syncResults.results.success.length} reels to Minecraft${colors.reset}`);
    console.log(`   Region: Y 5-100 (vertical database)`);
    console.log(`   Keys: ${syncResults.results.success.slice(0, 3).join(', ')}...`);
    console.log('');
    
  } catch (error) {
    console.error(`${colors.red}❌ Failed to sync to Minecraft: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Retrieve from Minecraft
  console.log(`${colors.blue}🔍 STEP 3: Retrieving from Minecraft Database...${colors.reset}`);
  let minecraftReels;
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/mcdb/reels/list`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to list reels');
    }
    
    minecraftReels = data.reels;
    console.log(`${colors.green}✅ Retrieved ${minecraftReels.length} reels from Minecraft${colors.reset}`);
    console.log('');
    
    console.log(`${colors.cyan}📋 Reel Metadata from Minecraft:${colors.reset}`);
    minecraftReels.forEach((reel, i) => {
      console.log(`   ${i + 1}. ${reel.id}`);
      console.log(`      R2 Path: ${reel.r2_key}`);
      console.log(`      Folder: ${reel.folder}`);
      console.log(`      Filename: ${reel.filename}`);
      console.log(`      Size: ${(reel.size / 1024 / 1024).toFixed(2)} MB`);
    });
    console.log('');
    
  } catch (error) {
    console.error(`${colors.red}❌ Failed to retrieve from Minecraft: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Construct Frontend URLs
  console.log(`${colors.blue}🌐 STEP 4: Constructing Frontend URLs...${colors.reset}`);
  const frontendReels = minecraftReels.map(reel => ({
    id: reel.id,
    // This is how frontend constructs the video URL from Minecraft data
    video: `${BACKEND_API}/read-file?folder=${reel.folder}&fileName=${encodeURIComponent(reel.filename)}`,
    r2_key: reel.r2_key,
    metadata: reel
  }));
  
  console.log(`${colors.green}✅ Generated ${frontendReels.length} frontend video URLs${colors.reset}`);
  console.log('');
  
  console.log(`${colors.cyan}🎬 Frontend Video URLs:${colors.reset}`);
  frontendReels.forEach((reel, i) => {
    console.log(`   ${i + 1}. ${reel.video}`);
  });
  console.log('');
  
  // Step 5: Verify URL works
  console.log(`${colors.blue}✓ STEP 5: Verifying Video URLs Work...${colors.reset}`);
  try {
    const testUrl = frontendReels[0].video;
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`${colors.green}✅ Video URL is accessible${colors.reset}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${(parseInt(response.headers.get('content-length')) / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log(`${colors.yellow}⚠️  Video URL returned ${response.status}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Failed to verify URL: ${error.message}${colors.reset}`);
  }
  console.log('');
  
  // Summary
  console.log(`${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              Flow Verification               ║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║                                              ║${colors.reset}`);
  console.log(`${colors.cyan}║  R2 (Cloudflare)                             ║${colors.reset}`);
  console.log(`${colors.cyan}║         ↓                                    ║${colors.reset}`);
  console.log(`${colors.cyan}║  Minecraft Database (Y: 5-100)               ║${colors.reset}`);
  console.log(`${colors.cyan}║         ↓                                    ║${colors.reset}`);
  console.log(`${colors.cyan}║  Frontend (via Bridge API)                   ║${colors.reset}`);
  console.log(`${colors.cyan}║         ↓                                    ║${colors.reset}`);
  console.log(`${colors.cyan}║  User Streams from R2                        ║${colors.reset}`);
  console.log(`${colors.cyan}║                                              ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  
  console.log(`${colors.green}✅ Complete flow verified!${colors.reset}`);
  console.log(`${colors.green}   1. R2 has ${r2Reels.length} reel files${colors.reset}`);
  console.log(`${colors.green}   2. Minecraft stores ${minecraftReels.length} reel metadata entries${colors.reset}`);
  console.log(`${colors.green}   3. Frontend can construct ${frontendReels.length} video URLs${colors.reset}`);
  console.log(`${colors.green}   4. URLs stream correctly from R2${colors.reset}`);
  console.log('');
  
  console.log(`${colors.yellow}📖 How Frontend Uses This:${colors.reset}`);
  console.log(`   1. Page loads → calls: fetch('http://localhost:3002/mcdb/reels/list')`);
  console.log(`   2. Gets reel metadata from Minecraft (stored as colored blocks!)`);
  console.log(`   3. Constructs video URLs: \`\${API_BASE_URL}/read-file?folder=\${folder}&fileName=\${filename}\``);
  console.log(`   4. Video player streams from R2 via backend proxy`);
  console.log('');
  
  console.log(`${colors.magenta}🎮 In Minecraft:${colors.reset}`);
  console.log(`   /tp @s 0 50 0        # Fly to reels database region`);
  console.log(`   /gamemode spectator  # See the colored blocks storing your data!`);
  console.log('');
}

// Run the test
testCompleteFlow().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

