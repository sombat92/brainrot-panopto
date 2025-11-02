/**
 * Minecraft Database Integration
 * 
 * Loads reel and lecture metadata from Minecraft vertical database regions
 */

const MINECRAFT_BRIDGE_URL = 'http://localhost:3002';

/**
 * Fetch all reels from Minecraft database (Y: 5-100)
 */
async function loadReelsFromMinecraft() {
  try {
    const response = await fetch(`${MINECRAFT_BRIDGE_URL}/mcdb/reels/list`);
    const data = await response.json();
    
    if (data.success && data.reels) {
      // Transform Minecraft format to frontend format
      return data.reels.map(reel => ({
        id: reel.id,
        video: `${API_BASE_URL}/read-file?folder=${reel.folder}&fileName=${encodeURIComponent(reel.filename)}`,
        title: reel.title || reel.filename,
        views: reel.views || 0,
        likes: reel.likes || 0,
        uploaded: reel.uploaded_at,
        size: reel.size,
        metadata: reel
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error loading reels from Minecraft:', error);
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
 */
async function initializeFromMinecraft() {
  const isConnected = await checkMinecraftConnection();
  
  if (!isConnected) {
    console.log('📦 Using static data (Minecraft bridge offline)');
    return false;
  }
  
  console.log('✅ Minecraft bridge connected, loading dynamic data...');
  
  try {
    // Load reels from Minecraft
    const minecraftReels = await loadReelsFromMinecraft();
    if (minecraftReels.length > 0) {
      console.log(`📹 Loaded ${minecraftReels.length} reels from Minecraft`);
      
      // Replace reelsData with Minecraft data
      reelsData.length = 0;
      reelsData.push(...minecraftReels);
      
      // Also update iPhone reels
      reelsDataIphone.length = 0;
      reelsDataIphone.push(...minecraftReels);
    }
    
    // Load lectures from Minecraft
    const minecraftLectures = await loadLecturesFromMinecraft();
    if (minecraftLectures.length > 0) {
      console.log(`🎓 Loaded ${minecraftLectures.length} lectures from Minecraft`);
      
      // Merge with existing lectures (avoid duplicates)
      minecraftLectures.forEach(mcLecture => {
        const exists = lecturesData.some(l => l.fileName === mcLecture.fileName);
        if (!exists) {
          lecturesData.push(mcLecture);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing from Minecraft:', error);
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

