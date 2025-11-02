#!/usr/bin/env node

/**
 * View Minecraft Database Contents
 * 
 * Displays what's stored in the vertically organized Minecraft database.
 */

const fetch = require('node-fetch');

const MINECRAFT_BRIDGE = 'http://localhost:3002';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function viewReels() {
  console.log(`\n${colors.blue}📹 REELS DATABASE (Y: 5-100)${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/mcdb/reels/list`);
    const data = await response.json();
    
    if (data.success && data.reels.length > 0) {
      console.log(`${colors.green}Found ${data.count} reel(s):${colors.reset}\n`);
      
      data.reels.forEach((reel, index) => {
        console.log(`${colors.cyan}${index + 1}. ${reel.id}${colors.reset}`);
        console.log(`   📁 File: ${reel.filename}`);
        console.log(`   📦 Size: ${(reel.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📅 Uploaded: ${new Date(reel.uploaded_at).toLocaleString()}`);
        console.log(`   🔑 R2 Key: ${reel.r2_key}`);
        console.log(`   👁️  Views: ${reel.views || 0} | ❤️  Likes: ${reel.likes || 0}`);
        console.log('');
      });
    } else {
      console.log(`${colors.yellow}No reels found in database${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching reels: ${error.message}${colors.reset}\n`);
  }
}

async function viewLectures() {
  console.log(`${colors.magenta}🎓 LECTURES DATABASE (Y: 105-200)${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
  
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/mcdb/lectures/list`);
    const data = await response.json();
    
    if (data.success && data.lectures.length > 0) {
      console.log(`${colors.green}Found ${data.count} lecture(s):${colors.reset}\n`);
      
      data.lectures.forEach((lecture, index) => {
        console.log(`${colors.cyan}${index + 1}. ${lecture.id}${colors.reset}`);
        console.log(`   📚 Title: ${lecture.title || 'N/A'}`);
        console.log(`   👨‍🏫 Instructor: ${lecture.instructor || 'N/A'}`);
        console.log(`   📁 File: ${lecture.filename}`);
        console.log(`   📦 Size: ${(lecture.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   ⏱️  Duration: ${lecture.duration || 'Unknown'}`);
        console.log(`   📅 Uploaded: ${new Date(lecture.uploaded_at).toLocaleString()}`);
        console.log(`   🔑 R2 Key: ${lecture.r2_key}`);
        if (lecture.description) {
          console.log(`   📝 Description: ${lecture.description}`);
        }
        console.log('');
      });
    } else {
      console.log(`${colors.yellow}No lectures found in database${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching lectures: ${error.message}${colors.reset}\n`);
  }
}

async function viewStats() {
  console.log(`${colors.cyan}📊 DATABASE STATISTICS${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/mcdb/stats`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const stats = data.data;
      console.log(`${colors.green}Minecraft Database Stats:${colors.reset}`);
      console.log(`   Total Entries: ${stats.entryCount || 0}`);
      console.log(`   Cache Size: ${stats.cacheSize || 0}`);
      console.log(`   Loaded Chunks: ${stats.loadedChunks || 0}`);
      console.log(`   Estimated Capacity: ${stats.estimatedCapacity || 'N/A'}`);
      console.log(`   Used Capacity: ${stats.usedCapacity || 0}%`);
      console.log('');
    } else {
      console.log(`${colors.yellow}Stats not available${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching stats: ${error.message}${colors.reset}\n`);
  }
}

async function checkConnection() {
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE}/health`);
    const data = await response.json();
    
    if (data.status === 'connected') {
      console.log(`${colors.green}✅ Connected to Minecraft Bridge (${data.minecraft_host}:${data.minecraft_port})${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}❌ Minecraft Bridge is disconnected${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Cannot connect to Minecraft Bridge (${MINECRAFT_BRIDGE})${colors.reset}`);
    console.log(`${colors.yellow}Make sure the bridge server is running:${colors.reset}`);
    console.log(`   cd minecraft-database/bridge-server && npm start\n`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║    Minecraft Database Viewer                 ║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║  View contents of vertical database regions  ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  const connected = await checkConnection();
  
  if (!connected) {
    process.exit(1);
  }
  
  await viewStats();
  await viewReels();
  await viewLectures();
  
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}✅ View complete${colors.reset}\n`);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

