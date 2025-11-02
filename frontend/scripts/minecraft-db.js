/**
 * Minecraft Database Integration
 * 
 * Loads reel and lecture metadata from Minecraft vertical database regions
 */

const MINECRAFT_BRIDGE_URL = 'http://localhost:3002';

/**
 * Fetch all reels from Minecraft database (Y: 5-100)
 * 
 * DATA FLOW:
 * 1. Query Minecraft Bridge API for reel metadata
 * 2. Minecraft returns stored R2 paths from colored blocks
 * 3. Construct full video URLs using R2 path from Minecraft
 * 4. Frontend streams video from R2 via backend proxy
 */
async function loadReelsFromMinecraft() {
  try {
    console.log('🎮 Querying Minecraft database for reels (Y: 5-100)...');
    
    const response = await fetch(`${MINECRAFT_BRIDGE_URL}/mcdb/reels/list`);
    const data = await response.json();
    
    if (data.success && data.reels) {
      console.log(`✅ Retrieved ${data.reels.length} reels from Minecraft database`);
      
      // Transform Minecraft format to frontend format
      // IMPORTANT: Video URL is constructed from R2 path stored in Minecraft!
      const transformedReels = data.reels.map(reel => {
        // Construct video URL from Minecraft-stored R2 path
        const videoUrl = `${API_BASE_URL}/read-file?folder=${reel.folder}&fileName=${encodeURIComponent(reel.filename)}`;
        
        console.log(`   📹 Reel: ${reel.filename} → ${videoUrl}`);
        console.log(`      👤 @${reel.username || 'unknown'}: "${reel.description || 'No description'}"`);
        
        return {
          id: reel.id,
          video: videoUrl,  // ← This URL is built from Minecraft data!
          title: reel.title || reel.filename,
          views: reel.views || 0,
          likes: reel.likes || 0,
          uploaded: reel.uploaded_at,
          size: reel.size,
          r2_key: reel.r2_key,  // Store original R2 key for reference
          // 🧠 Brainrot metadata
          username: reel.username || 'anonymous',
          description: reel.description || 'No description available',
          metadata: reel
        };
      });
      
      return transformedReels;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error loading reels from Minecraft:', error);
    console.log('ℹ️  Falling back to static data');
    return [];
  }
}

/**
 * Fetch all lectures from Minecraft database (Y: 105-200)
 */
async function loadLecturesFromMinecraft() {
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE_URL}/mcdb/lectures/list`);
    const data = await response.json();
    
    if (data.success && data.lectures) {
      // Transform Minecraft format to frontend format
      return data.lectures.map((lecture, index) => ({
        id: lecture.id || `minecraft_lecture_${index + 1}`,
        title: lecture.title || lecture.filename.replace(/\.[^/.]+$/, ''),
        module: lecture.module || 'Uploaded Content',
        instructor: lecture.instructor || 'Unknown',
        duration: lecture.duration || '—',
        thumbnail: lecture.thumbnail || '/lecture-1.jpg',
        description: lecture.description || `Lecture from Minecraft database`,
        date: lecture.uploaded_at ? new Date(lecture.uploaded_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : 'Unknown date',
        section: 'minecraft',
        folder: lecture.folder,
        fileName: lecture.filename,
        size: lecture.size,
        r2_key: lecture.r2_key,
        metadata: lecture
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error loading lectures from Minecraft:', error);
    return [];
  }
}

/**
 * Check if Minecraft bridge is available
 */
async function checkMinecraftConnection() {
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE_URL}/health`);
    const data = await response.json();
    return data.status === 'connected';
  } catch (error) {
    console.log('Minecraft bridge not available, using static data');
    return false;
  }
}

/**
 * Initialize: Load data from Minecraft if available, otherwise use static data
 * 
 * DATA FLOW EXPLANATION:
 * ┌─────────────────────────────────────────────┐
 * │ 1. R2 Storage (Cloudflare)                  │
 * │    - Stores actual video files              │
 * │    - Path: reels/filename.mp4               │
 * └────────────┬────────────────────────────────┘
 *              │
 *              ↓ (sync-to-minecraft.js stores metadata)
 * ┌────────────┴────────────────────────────────┐
 * │ 2. Minecraft Database (Y: 5-100)            │
 * │    - Stores R2 file paths as colored blocks │
 * │    - Stores metadata (size, date, etc)      │
 * └────────────┬────────────────────────────────┘
 *              │
 *              ↓ (this function queries)
 * ┌────────────┴────────────────────────────────┐
 * │ 3. Frontend (Browser)                       │
 * │    - Gets R2 paths from Minecraft           │
 * │    - Constructs video URLs                  │
 * │    - Streams from R2 via backend proxy      │
 * └─────────────────────────────────────────────┘
 */
async function initializeFromMinecraft() {
  console.log('🔄 Initializing data from Minecraft database...');
  
  const isConnected = await checkMinecraftConnection();
  
  if (!isConnected) {
    console.log('📦 Minecraft bridge offline - using static fallback data');
    console.log('ℹ️  To enable dynamic loading:');
    console.log('   1. Start Minecraft server with database plugin');
    console.log('   2. Start bridge: cd minecraft-database/bridge-server && npm start');
    console.log('   3. Sync data: node sync-to-minecraft.js');
    return false;
  }
  
  console.log('✅ Minecraft bridge connected!');
  console.log('🎮 Loading video locations from Minecraft database (stored as colored blocks)...');
  
  try {
    // Load reels from Minecraft (Y: 5-100)
    const minecraftReels = await loadReelsFromMinecraft();
    if (minecraftReels.length > 0) {
      console.log(`📹 Successfully loaded ${minecraftReels.length} reels from Minecraft`);
      console.log('   → Video URLs constructed from Minecraft-stored R2 paths');
      
      // Replace static reelsData with dynamic Minecraft data
      reelsData.length = 0;
      reelsData.push(...minecraftReels);
      
      // Also update iPhone reels
      reelsDataIphone.length = 0;
      reelsDataIphone.push(...minecraftReels);
      
      console.log('   ✓ reelsData array updated with Minecraft data');
    } else {
      console.log('⚠️  No reels found in Minecraft - keeping static data');
      console.log('   Run: node sync-to-minecraft.js');
    }
    
    // Load lectures from Minecraft (Y: 105-200)
    const minecraftLectures = await loadLecturesFromMinecraft();
    if (minecraftLectures.length > 0) {
      console.log(`🎓 Successfully loaded ${minecraftLectures.length} lectures from Minecraft`);
      
      // Merge with existing lectures (avoid duplicates)
      minecraftLectures.forEach(mcLecture => {
        const exists = lecturesData.some(l => l.fileName === mcLecture.fileName);
        if (!exists) {
          lecturesData.push(mcLecture);
        }
      });
      
      console.log('   ✓ lecturesData array updated with Minecraft data');
    }
    
    console.log('🎉 Minecraft integration complete!');
    console.log('   All video URLs now point to R2 files referenced in Minecraft');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing from Minecraft:', error);
    console.log('📦 Falling back to static data');
    return false;
  }
}

/**
 * Sync button handler - trigger R2 to Minecraft sync
 */
async function triggerMinecraftSync() {
  const statusEl = document.getElementById('sync-status');
  if (statusEl) {
    statusEl.textContent = 'Syncing R2 to Minecraft...';
    statusEl.className = 'sync-status syncing';
  }
  
  try {
    // Run the sync script via backend API
    const response = await fetch('/api/sync-minecraft', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (statusEl) {
        statusEl.textContent = `✅ Synced ${data.reelsCount} reels and ${data.lecturesCount} lectures`;
        statusEl.className = 'sync-status success';
      }
      
      // Reload data
      await initializeFromMinecraft();
    } else {
      if (statusEl) {
        statusEl.textContent = `❌ Sync failed: ${data.error}`;
        statusEl.className = 'sync-status error';
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
    if (statusEl) {
      statusEl.textContent = `❌ Sync failed: ${error.message}`;
      statusEl.className = 'sync-status error';
    }
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Give other scripts time to load first
    setTimeout(initializeFromMinecraft, 1000);
  });
}

