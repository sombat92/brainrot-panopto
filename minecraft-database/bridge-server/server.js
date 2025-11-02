const express = require('express');
const net = require('net');
const crypto = require('crypto');
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
      const metadata = {
        id: reelId,
        r2_key: file.key,
        folder: 'reels',
        filename: file.key.split('/').pop(),
        size: file.size || 0,
        uploaded_at: file.lastModified || new Date().toISOString(),
        etag: file.etag || '',
        duration: 0,
        views: 0,
        likes: 0
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

// Sync R2 lectures to Minecraft (Region: Y 105-200)
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
      console.log('║      Reels:    Y 5-100   (reel:* keys)      ║');
      console.log('║      Lectures: Y 105-200 (lecture:* keys)   ║');
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
      console.log('╚══════════════════════════════════════════════╝');
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

