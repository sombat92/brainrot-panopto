const express = require('express');
const net = require('net');
const crypto = require('crypto');
const path = require('path');

// Import brainrot content generator
const { getPairForFilename } = require(path.join(__dirname, '../../admin/brainrot-content-generator.js'));
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const MINECRAFT_HOST = process.env.MINECRAFT_HOST || 'localhost';
const MINECRAFT_PORT = parseInt(process.env.MINECRAFT_PORT) || 25566;
const MINECRAFT_TOKEN = process.env.MINECRAFT_AUTH_TOKEN || 'change-me-in-production-please';
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT) || 3002;

// Auto-sync configuration
const AUTO_SYNC_ENABLED = process.env.AUTO_SYNC_ENABLED !== 'false'; // Default: true
const AUTO_SYNC_INTERVAL = parseInt(process.env.AUTO_SYNC_INTERVAL) || 300000; // Default: 5 minutes (300000ms)
const R2_BACKEND_URL = process.env.R2_BACKEND_URL || 'http://localhost:3001';

// Connection pool
class MinecraftConnection {
  constructor() {
    this.socket = null;
    this.pendingRequests = new Map();
    this.connected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(MINECRAFT_PORT, MINECRAFT_HOST, () => {
        this.connected = true;
        console.log('✓ Connected to Minecraft server at ' + MINECRAFT_HOST + ':' + MINECRAFT_PORT);
        resolve();
      });

      this.socket.setEncoding('utf8');

      this.socket.on('data', (data) => {
        this.handleResponse(data);
      });

      this.socket.on('error', (err) => {
        console.error('Socket error:', err.message);
        this.connected = false;
        reject(err);
      });

      this.socket.on('close', () => {
        this.connected = false;
        console.log('Connection to Minecraft server closed');
        
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect().catch(() => {}), 5000);
      });
    });
  }

  async sendCommand(command, data) {
    if (!this.connected) {
      throw new Error('Not connected to Minecraft server');
    }

    const id = crypto.randomUUID();
    const message = JSON.stringify({
      id,
      auth: MINECRAFT_TOKEN,
      command,
      data: data || {}
    });

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.socket.write(message + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  handleResponse(data) {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (!line) continue;
        
        const response = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id);
        
        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.success) {
            pending.resolve(response);
          } else {
            pending.reject(new Error(response.error || 'Unknown error'));
          }
        }
      }
    } catch (err) {
      console.error('Error parsing response:', err.message);
    }
  }

  isConnected() {
    return this.connected;
  }
}

const minecraft = new MinecraftConnection();

// API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: minecraft.isConnected() ? 'connected' : 'disconnected',
    minecraft_host: MINECRAFT_HOST,
    minecraft_port: MINECRAFT_PORT
  });
});

// Write data to Minecraft database
app.post('/mcdb/write', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key' });
    }
    
    if (!value) {
      return res.status(400).json({ error: 'Missing value' });
    }
    
    // Encode value as base64 if it's a string
    const encodedValue = Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
      .toString('base64');
    
    const response = await minecraft.sendCommand('WRITE', { 
      key, 
      value: encodedValue 
    });
    
    res.json(response);
  } catch (error) {
    console.error('Write error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Read data from Minecraft database
app.get('/mcdb/read/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const response = await minecraft.sendCommand('READ', { key });
    
    // Decode base64 value
    if (response.data && response.data.value) {
      response.data.value = Buffer.from(response.data.value, 'base64').toString('utf8');
      
      // Try to parse as JSON
      try {
        response.data.value = JSON.parse(response.data.value);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    res.json(response);
  } catch (error) {
    console.error('Read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete data from Minecraft database
app.delete('/mcdb/delete/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const response = await minecraft.sendCommand('DELETE', { key });
    res.json(response);
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// List all keys
app.get('/mcdb/list', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('LIST', {});
    res.json(response);
  } catch (error) {
    console.error('List error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Check if key exists
app.get('/mcdb/exists/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const response = await minecraft.sendCommand('EXISTS', { key });
    res.json(response);
  } catch (error) {
    console.error('Exists error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
app.get('/mcdb/stats', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('STATS', {});
    res.json(response);
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VERTICAL DATABASE REGIONS - R2 Sync
// ============================================

// Sync R2 reels to Minecraft (Region: Y 5-100)
app.post('/mcdb/reels/sync', async (req, res) => {
  try {
    const { r2BaseUrl, r2Files } = req.body;
    
    if (!r2Files || !Array.isArray(r2Files)) {
      return res.status(400).json({ error: 'r2Files array required' });
    }
    
    const results = {
      success: [],
      failed: [],
      total: r2Files.length
    };
    
    for (const file of r2Files) {
      const reelId = `reel:${file.key}`;
      // Generate brainrot username and description
      const filename = file.key.split('/').pop();
      const brainrotContent = getPairForFilename(filename);
      
      const metadata = {
        id: reelId,
        r2_key: file.key,
        folder: 'reels',
        filename: filename,
        size: file.size || 0,
        uploaded_at: file.lastModified || new Date().toISOString(),
        etag: file.etag || '',
        duration: 0,
        views: Math.floor(Math.random() * 1000000) + 1000, // Random views 1K-1M
        likes: Math.floor(Math.random() * 50000) + 100,     // Random likes 100-50K
        // 🧠 Brainrot metadata (information-dense)
        username: brainrotContent.username,
        description: brainrotContent.description
      };
      
      try {
        const encodedValue = Buffer.from(JSON.stringify(metadata)).toString('base64');
        await minecraft.sendCommand('WRITE', { key: reelId, value: encodedValue });
        results.success.push(reelId);
      } catch (err) {
        results.failed.push({ id: reelId, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${results.success.length}/${results.total} reels`,
      results
    });
  } catch (error) {
    console.error('Reel sync error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sync R2 lectures to Minecraft (Region: Y 104-143 - Above Reels)
app.post('/mcdb/lectures/sync', async (req, res) => {
  try {
    const { r2Files, lecturesData } = req.body;
    
    if (!r2Files || !Array.isArray(r2Files)) {
      return res.status(400).json({ error: 'r2Files array required' });
    }
    
    const results = {
      success: [],
      failed: [],
      total: r2Files.length
    };
    
    for (const file of r2Files) {
      const filename = file.key.split('/').pop();
      const lectureId = `lecture:${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Try to match with lecturesData if provided
      let additionalData = {};
      if (lecturesData) {
        const match = lecturesData.find(l => l.fileName === filename);
        if (match) {
          additionalData = {
            title: match.title,
            module: match.module,
            instructor: match.instructor,
            duration: match.duration,
            thumbnail: match.thumbnail,
            description: match.description
          };
        }
      }
      
      const metadata = {
        id: lectureId,
        r2_key: file.key,
        folder: 'lectures',
        filename: filename,
        size: file.size || 0,
        uploaded_at: file.lastModified || new Date().toISOString(),
        etag: file.etag || '',
        ...additionalData
      };
      
      try {
        const encodedValue = Buffer.from(JSON.stringify(metadata)).toString('base64');
        await minecraft.sendCommand('WRITE', { key: lectureId, value: encodedValue });
        results.success.push(lectureId);
      } catch (err) {
        results.failed.push({ id: lectureId, error: err.message });
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${results.success.length}/${results.total} lectures`,
      results
    });
  } catch (error) {
    console.error('Lecture sync error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// List all reels from Minecraft
app.get('/mcdb/reels/list', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('LIST', {});
    
    if (response.success && response.data && response.data.keys) {
      const reelKeys = response.data.keys.filter(key => key.startsWith('reel:'));
      
      // Fetch metadata for each reel
      const reels = [];
      for (const key of reelKeys) {
        try {
          const data = await minecraft.sendCommand('READ', { key });
          if (data.success && data.data.value) {
            const metadata = JSON.parse(Buffer.from(data.data.value, 'base64').toString('utf8'));
            reels.push(metadata);
          }
        } catch (err) {
          console.error(`Error reading reel ${key}:`, err.message);
        }
      }
      
      res.json({
        success: true,
        count: reels.length,
        reels
      });
    } else {
      res.json({ success: true, count: 0, reels: [] });
    }
  } catch (error) {
    console.error('Reel list error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// List all lectures from Minecraft
app.get('/mcdb/lectures/list', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('LIST', {});
    
    if (response.success && response.data && response.data.keys) {
      const lectureKeys = response.data.keys.filter(key => key.startsWith('lecture:'));
      
      // Fetch metadata for each lecture
      const lectures = [];
      for (const key of lectureKeys) {
        try {
          const data = await minecraft.sendCommand('READ', { key });
          if (data.success && data.data.value) {
            const metadata = JSON.parse(Buffer.from(data.data.value, 'base64').toString('utf8'));
            lectures.push(metadata);
          }
        } catch (err) {
          console.error(`Error reading lecture ${key}:`, err.message);
        }
      }
      
      res.json({
        success: true,
        count: lectures.length,
        lectures
      });
    } else {
      res.json({ success: true, count: 0, lectures: [] });
    }
  } catch (error) {
    console.error('Lecture list error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific reel by ID
app.get('/mcdb/reels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const key = id.startsWith('reel:') ? id : `reel:${id}`;
    
    const response = await minecraft.sendCommand('READ', { key });
    
    if (response.data && response.data.value) {
      response.data.value = JSON.parse(Buffer.from(response.data.value, 'base64').toString('utf8'));
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get reel error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific lecture by ID
app.get('/mcdb/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const key = id.startsWith('lecture:') ? id : `lecture:${id}`;
    
    const response = await minecraft.sendCommand('READ', { key });
    
    if (response.data && response.data.value) {
      response.data.value = JSON.parse(Buffer.from(response.data.value, 'base64').toString('utf8'));
    }
    
    res.json(response);
  } catch (error) {
    console.error('Get lecture error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NOTES DATABASE - 3rd Vertical Region (Y: 144-173)
// Ground-level compact layout - notes at top
// ============================================

// Save note for a lecture
app.post('/mcdb/notes/save', async (req, res) => {
  try {
    const { lectureId, userId = 'default', content } = req.body;
    
    if (!lectureId) {
      return res.status(400).json({ error: 'lectureId required' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ error: 'content required' });
    }
    
    // Create note key: note:{userId}_{lectureId}
    const noteKey = `note:${userId}_${lectureId}`;
    
    const noteData = {
      id: noteKey,
      lectureId: lectureId,
      userId: userId,
      content: content,
      lastModified: new Date().toISOString(),
      wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
      charCount: content.length,
      created: new Date().toISOString() // Will be overwritten if note exists
    };
    
    // Try to read existing note to preserve creation date
    try {
      const existing = await minecraft.sendCommand('READ', { key: noteKey });
      if (existing.success && existing.data && existing.data.value) {
        const existingNote = JSON.parse(Buffer.from(existing.data.value, 'base64').toString('utf8'));
        if (existingNote.created) {
          noteData.created = existingNote.created;
        }
      }
    } catch (err) {
      // Note doesn't exist yet, that's fine
    }
    
    // Encode and save
    const encodedValue = Buffer.from(JSON.stringify(noteData)).toString('base64');
    const response = await minecraft.sendCommand('WRITE', { key: noteKey, value: encodedValue });
    
    res.json({
      success: response.success,
      noteId: noteKey,
      lastModified: noteData.lastModified,
      wordCount: noteData.wordCount,
      charCount: noteData.charCount
    });
    
  } catch (error) {
    console.error('Save note error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get note for a lecture
app.get('/mcdb/notes/get/:lectureId', async (req, res) => {
  try {
    const { lectureId } = req.params;
    const userId = req.query.userId || 'default';
    
    const noteKey = `note:${userId}_${lectureId}`;
    
    const response = await minecraft.sendCommand('READ', { key: noteKey });
    
    if (response.success && response.data && response.data.value) {
      const note = JSON.parse(Buffer.from(response.data.value, 'base64').toString('utf8'));
      res.json({
        success: true,
        note: note
      });
    } else {
      // No note found, return empty
      res.json({
        success: true,
        note: null
      });
    }
    
  } catch (error) {
    console.error('Get note error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// List all notes
app.get('/mcdb/notes/list', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const response = await minecraft.sendCommand('LIST', {});
    
    if (response.success && response.data && response.data.keys) {
      const noteKeys = response.data.keys.filter(key => key.startsWith(`note:${userId}_`));
      
      // Fetch content for each note
      const notes = [];
      for (const key of noteKeys) {
        try {
          const data = await minecraft.sendCommand('READ', { key });
          if (data.success && data.data.value) {
            const note = JSON.parse(Buffer.from(data.data.value, 'base64').toString('utf8'));
            notes.push(note);
          }
        } catch (err) {
          console.error(`Error reading note ${key}:`, err.message);
        }
      }
      
      // Sort by last modified (newest first)
      notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
      res.json({
        success: true,
        count: notes.length,
        notes: notes
      });
    } else {
      res.json({ success: true, count: 0, notes: [] });
    }
  } catch (error) {
    console.error('List notes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete note
app.delete('/mcdb/notes/delete/:lectureId', async (req, res) => {
  try {
    const { lectureId } = req.params;
    const userId = req.query.userId || 'default';
    
    const noteKey = `note:${userId}_${lectureId}`;
    const response = await minecraft.sendCommand('DELETE', { key: noteKey });
    
    res.json(response);
  } catch (error) {
    console.error('Delete note error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTO-SYNC SYSTEM - R2 to Minecraft
// ============================================

let autoSyncStats = {
  enabled: AUTO_SYNC_ENABLED,
  lastSync: null,
  nextSync: null,
  totalSynced: 0,
  totalSkipped: 0,
  lastError: null,
  isRunning: false
};

/**
 * Fetch R2 files from backend API
 */
async function fetchR2Files(folder) {
  try {
    const response = await fetch(`${R2_BACKEND_URL}/list-files?folder=${folder}`);
    const data = await response.json();
    
    if (data.success && data.files) {
      return data.files.filter(f => f.size > 0 && f.key !== `${folder}/`);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching R2 files from ${folder}:`, error.message);
    return [];
  }
}

/**
 * Get all keys from Minecraft database
 */
async function getMinecraftKeys() {
  try {
    const response = await minecraft.sendCommand('LIST', {});
    if (response.success && response.data && response.data.keys) {
      return new Set(response.data.keys);
    }
    return new Set();
  } catch (error) {
    console.error('Error getting Minecraft keys:', error.message);
    return new Set();
  }
}

/**
 * Sync new R2 files to Minecraft
 */
async function autoSyncR2ToMinecraft() {
  if (autoSyncStats.isRunning) {
    console.log('⏭️  Auto-sync already running, skipping...');
    return;
  }
  
  autoSyncStats.isRunning = true;
  autoSyncStats.lastSync = new Date().toISOString();
  
  try {
    console.log('\n🔄 [AUTO-SYNC] Starting R2 → Minecraft sync...');
    
    // Get existing Minecraft keys
    const existingKeys = await getMinecraftKeys();
    console.log(`   📊 Minecraft has ${existingKeys.size} entries`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    
    // Sync reels
    console.log('   📹 Checking reels...');
    const reelFiles = await fetchR2Files('reels');
    console.log(`   📊 R2 has ${reelFiles.length} reels`);
    
    for (const file of reelFiles) {
      const reelId = `reel:${file.key}`;
      
      if (existingKeys.has(reelId)) {
        skippedCount++;
        continue; // Already exists
      }
      
      // New file! Sync it
      const filename = file.key.split('/').pop();
      const brainrotContent = getPairForFilename(filename);
      
      const metadata = {
        id: reelId,
        r2_key: file.key,
        folder: 'reels',
        filename: filename,
        size: file.size || 0,
        uploaded_at: file.lastModified || new Date().toISOString(),
        etag: file.etag || '',
        duration: 0,
        views: Math.floor(Math.random() * 1000000) + 1000,
        likes: Math.floor(Math.random() * 50000) + 100,
        username: brainrotContent.username,
        description: brainrotContent.description
      };
      
      try {
        const encodedValue = Buffer.from(JSON.stringify(metadata)).toString('base64');
        await minecraft.sendCommand('WRITE', { key: reelId, value: encodedValue });
        console.log(`   ✅ Synced new reel: ${filename}`);
        syncedCount++;
      } catch (err) {
        console.error(`   ❌ Failed to sync ${filename}:`, err.message);
      }
    }
    
    // Sync lectures
    console.log('   🎓 Checking lectures...');
    const lectureFiles = await fetchR2Files('lectures');
    console.log(`   📊 R2 has ${lectureFiles.length} lectures`);
    
    for (const file of lectureFiles) {
      const filename = file.key.split('/').pop();
      const lectureId = `lecture:${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      if (existingKeys.has(lectureId)) {
        skippedCount++;
        continue; // Already exists
      }
      
      // New file! Sync it
      const metadata = {
        id: lectureId,
        r2_key: file.key,
        folder: 'lectures',
        filename: filename,
        size: file.size || 0,
        uploaded_at: file.lastModified || new Date().toISOString(),
        etag: file.etag || ''
      };
      
      try {
        const encodedValue = Buffer.from(JSON.stringify(metadata)).toString('base64');
        await minecraft.sendCommand('WRITE', { key: lectureId, value: encodedValue });
        console.log(`   ✅ Synced new lecture: ${filename}`);
        syncedCount++;
      } catch (err) {
        console.error(`   ❌ Failed to sync ${filename}:`, err.message);
      }
    }
    
    console.log(`\n✨ [AUTO-SYNC] Complete!`);
    console.log(`   📥 Synced: ${syncedCount} new files`);
    console.log(`   ⏭️  Skipped: ${skippedCount} existing files`);
    
    autoSyncStats.totalSynced += syncedCount;
    autoSyncStats.totalSkipped += skippedCount;
    autoSyncStats.lastError = null;
    
  } catch (error) {
    console.error(`\n❌ [AUTO-SYNC] Error:`, error.message);
    autoSyncStats.lastError = error.message;
  } finally {
    autoSyncStats.isRunning = false;
    autoSyncStats.nextSync = new Date(Date.now() + AUTO_SYNC_INTERVAL).toISOString();
  }
}

/**
 * Start auto-sync loop
 */
function startAutoSync() {
  if (!AUTO_SYNC_ENABLED) {
    console.log('⏸️  Auto-sync disabled (set AUTO_SYNC_ENABLED=true to enable)');
    return;
  }
  
  console.log(`\n🔄 Auto-sync enabled!`);
  console.log(`   ⏰ Interval: ${AUTO_SYNC_INTERVAL / 1000} seconds`);
  console.log(`   🎯 R2 Backend: ${R2_BACKEND_URL}`);
  
  // Run initial sync after 10 seconds (give servers time to start)
  setTimeout(() => {
    autoSyncR2ToMinecraft();
  }, 10000);
  
  // Then run periodically
  setInterval(() => {
    autoSyncR2ToMinecraft();
  }, AUTO_SYNC_INTERVAL);
}

// Auto-sync status endpoint
app.get('/mcdb/auto-sync/status', (req, res) => {
  res.json({
    success: true,
    status: autoSyncStats
  });
});

// Manual trigger endpoint
app.post('/mcdb/auto-sync/trigger', async (req, res) => {
  if (autoSyncStats.isRunning) {
    return res.json({
      success: false,
      message: 'Sync already in progress'
    });
  }
  
  // Run sync in background
  autoSyncR2ToMinecraft().catch(console.error);
  
  res.json({
    success: true,
    message: 'Sync triggered',
    nextSync: autoSyncStats.nextSync
  });
});

// Enable/disable auto-sync
app.post('/mcdb/auto-sync/toggle', (req, res) => {
  const { enabled } = req.body;
  autoSyncStats.enabled = enabled;
  
  res.json({
    success: true,
    enabled: autoSyncStats.enabled,
    message: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`
  });
});

// Start server
minecraft.connect()
  .then(() => {
    app.listen(BRIDGE_PORT, () => {
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   Minecraft Database Bridge Server          ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║   HTTP Server: http://localhost:${BRIDGE_PORT}      ║`);
      console.log(`║   Minecraft: ${MINECRAFT_HOST}:${MINECRAFT_PORT}               ║`);
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   📚 Database Regions (Vertical):            ║');
      console.log('║      Notes:    Y 201-250 (note:* keys)      ║');
      console.log('║      Lectures: Y 105-200 (lecture:* keys)   ║');
      console.log('║      Reels:    Y 5-100   (reel:* keys)      ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   Core Endpoints:                            ║');
      console.log('║   POST   /mcdb/write                         ║');
      console.log('║   GET    /mcdb/read/:key                     ║');
      console.log('║   DELETE /mcdb/delete/:key                   ║');
      console.log('║   GET    /mcdb/list                          ║');
      console.log('║   GET    /mcdb/stats                         ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   🎬 Reel Endpoints:                         ║');
      console.log('║   POST   /mcdb/reels/sync                    ║');
      console.log('║   GET    /mcdb/reels/list                    ║');
      console.log('║   GET    /mcdb/reels/:id                     ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   🎓 Lecture Endpoints:                      ║');
      console.log('║   POST   /mcdb/lectures/sync                 ║');
      console.log('║   GET    /mcdb/lectures/list                 ║');
      console.log('║   GET    /mcdb/lectures/:id                  ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   📝 Notes Endpoints (3rd Region):           ║');
      console.log('║   POST   /mcdb/notes/save                    ║');
      console.log('║   GET    /mcdb/notes/get/:lectureId          ║');
      console.log('║   GET    /mcdb/notes/list                    ║');
      console.log('║   DELETE /mcdb/notes/delete/:lectureId       ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log('║   🔄 Auto-Sync Endpoints:                    ║');
      console.log('║   GET    /mcdb/auto-sync/status              ║');
      console.log('║   POST   /mcdb/auto-sync/trigger             ║');
      console.log('║   POST   /mcdb/auto-sync/toggle              ║');
      console.log('╚══════════════════════════════════════════════╝');
      
      // Start auto-sync loop
      startAutoSync();
    });
  })
  .catch(err => {
    console.error('Failed to connect to Minecraft server:', err.message);
    console.log('Starting bridge server anyway (will retry connection)...');
    
    app.listen(BRIDGE_PORT, () => {
      console.log(`Bridge server running on port ${BRIDGE_PORT} (Minecraft connection pending)`);
    });
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down bridge server...');
  if (minecraft.socket) {
    minecraft.socket.destroy();
  }
  process.exit(0);
});

