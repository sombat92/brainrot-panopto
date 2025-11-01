# Minecraft Block Database - Implementation Plan

## 🎮 Project Overview

Create a Minecraft server plugin that uses permanently loaded chunks as a database, where different block types and positions represent stored data. The plugin receives data via socket connections and manipulates blocks to store/retrieve information.

---

## 🏗️ System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│  Website/Client │◄──HTTP──►│  Bridge Server   │◄──TCP───►│ Minecraft Plugin  │
│ (brainrot-      │         │  (Node.js/Python)│         │  (Spigot/Paper)   │
│  panopto)       │         │  Port: 3001      │         │  Port: 25566      │
└─────────────────┘         └──────────────────┘         └────────────────────┘
                                                                     │
                                                                     ▼
                                                          ┌────────────────────┐
                                                          │  Minecraft World   │
                                                          │  (Block Database)  │
                                                          │  Chunk 0,0 - 4,4   │
                                                          └────────────────────┘
```

---

## 📁 Project Structure

```
minecraft-database/
├── plugin/                           # Minecraft server plugin
│   ├── src/main/
│   │   ├── java/com/brainrot/mcdb/
│   │   │   ├── MinecraftDBPlugin.java
│   │   │   ├── socket/
│   │   │   │   ├── SocketServer.java
│   │   │   │   ├── CommandHandler.java
│   │   │   │   └── ProtocolParser.java
│   │   │   ├── database/
│   │   │   │   ├── BlockDatabase.java
│   │   │   │   ├── ChunkManager.java
│   │   │   │   ├── DataEncoder.java
│   │   │   │   └── AddressMapper.java
│   │   │   ├── models/
│   │   │   │   ├── DataEntry.java
│   │   │   │   ├── BlockPosition.java
│   │   │   │   └── DataAddress.java
│   │   │   └── utils/
│   │   │       ├── ConfigManager.java
│   │   │       └── Logger.java
│   │   └── resources/
│   │       ├── plugin.yml
│   │       └── config.yml
│   └── pom.xml                       # Maven build file
│
├── bridge-server/                    # HTTP to Socket bridge
│   ├── server.js                     # Node.js Express server
│   ├── minecraft-client.js           # Socket client
│   ├── package.json
│   └── .env
│
└── docs/
    ├── PROTOCOL.md                   # Socket protocol specification
    ├── ENCODING.md                   # Block encoding schemes
    └── API.md                        # Bridge API documentation
```

---

## 🔧 Phase 1: Minecraft Plugin Setup

### Step 1.1: Create Maven Project

**pom.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.brainrot</groupId>
    <artifactId>minecraft-database</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>spigot-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
        <repository>
            <id>papermc</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
    </repositories>

    <dependencies>
        <!-- Paper API (recommended over Spigot) -->
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>1.20.4-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- JSON Processing -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.0</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Step 1.2: Plugin Configuration

**plugin.yml:**
```yaml
name: MinecraftDatabase
version: 1.0.0
main: com.brainrot.mcdb.MinecraftDBPlugin
api-version: 1.20
author: Brainrot Team
description: Use Minecraft chunks as a database via block manipulation

commands:
  mcdb:
    description: Minecraft Database commands
    usage: /<command> [reload|status|clear|test]
    permission: mcdb.admin
    
permissions:
  mcdb.admin:
    description: Access to all MCDB commands
    default: op
```

**config.yml:**
```yaml
# Minecraft Database Plugin Configuration

socket:
  enabled: true
  host: "0.0.0.0"
  port: 25566
  auth-token: "change-me-in-production"
  max-connections: 10
  timeout-seconds: 30

database:
  world: "world"
  
  # Database storage area (permanently loaded chunks)
  chunks:
    start-x: 0
    start-z: 0
    end-x: 3      # 4x4 chunk area = 64x64 blocks
    end-z: 3
  
  storage:
    min-y: 5      # Start at Y=5 (above bedrock)
    max-y: 250    # Up to Y=250
    
    # Encoding method: "simple" (16 blocks) or "advanced" (256 blocks)
    encoding: "simple"
    
    # How many blocks per data entry
    blocks-per-key: 16
    blocks-per-value: 32
  
  # Protection settings
  protection:
    prevent-player-access: true
    prevent-explosions: true
    prevent-block-updates: true
    prevent-mob-spawning: true
    teleport-distance: 100  # Teleport players this far away

# Logging
logging:
  level: "INFO"  # DEBUG, INFO, WARN, ERROR
  log-operations: true
  log-socket-connections: true

# Performance
performance:
  async-operations: true
  batch-writes: true
  cache-size: 1000
  cache-ttl-seconds: 300
```

---

## 💾 Phase 2: Data Encoding System

### Block Encoding Schemes

#### Simple Encoding (16 block types = 4 bits per block)

```java
public enum SimpleBlockPalette {
    // Stone variants (0-3)
    STONE(Material.STONE, 0),
    GRANITE(Material.GRANITE, 1),
    POLISHED_GRANITE(Material.POLISHED_GRANITE, 2),
    DIORITE(Material.DIORITE, 3),
    
    // Wood variants (4-7)
    OAK_PLANKS(Material.OAK_PLANKS, 4),
    SPRUCE_PLANKS(Material.SPRUCE_PLANKS, 5),
    BIRCH_PLANKS(Material.BIRCH_PLANKS, 6),
    JUNGLE_PLANKS(Material.JUNGLE_PLANKS, 7),
    
    // Wool variants (8-15)
    WHITE_WOOL(Material.WHITE_WOOL, 8),
    ORANGE_WOOL(Material.ORANGE_WOOL, 9),
    MAGENTA_WOOL(Material.MAGENTA_WOOL, 10),
    LIGHT_BLUE_WOOL(Material.LIGHT_BLUE_WOOL, 11),
    YELLOW_WOOL(Material.YELLOW_WOOL, 12),
    LIME_WOOL(Material.LIME_WOOL, 13),
    PINK_WOOL(Material.PINK_WOOL, 14),
    GRAY_WOOL(Material.GRAY_WOOL, 15);
    
    private final Material material;
    private final int value;
}
```

**Encoding Example:**
- 1 byte = 2 blocks (4 bits each)
- String "Hi" = ASCII 72, 105 = 0x48, 0x69
- 0x48 = 0100 1000 → GRANITE, OAK_PLANKS, STONE, STONE
- 0x69 = 0110 1001 → BIRCH_PLANKS, JUNGLE_PLANKS, STONE, GRANITE

#### Advanced Encoding (256 block types = 8 bits per block)

Uses full block palette + block states for higher density storage.

### Storage Layout

```
Chunk Grid (4x4 chunks = 64x64 blocks):

Y=5-10:   Metadata Layer (indexes, keys)
Y=11-250: Data Storage Layer

Each Data Entry:
[16 blocks: Key/ID] [32 blocks: Value/Data] [2 blocks: Metadata]
```

---

## 🔌 Phase 3: Socket Server

### Protocol Specification

**Message Format (JSON):**
```json
{
  "id": "unique-request-id",
  "auth": "your-auth-token",
  "command": "WRITE|READ|DELETE|LIST|QUERY",
  "data": {
    "key": "user_123",
    "value": "base64_encoded_data",
    "metadata": {}
  }
}
```

**Response Format:**
```json
{
  "id": "unique-request-id",
  "success": true,
  "command": "WRITE",
  "data": {
    "key": "user_123",
    "blocks_used": 48,
    "address": "chunk_0_0_y5"
  },
  "error": null,
  "timestamp": 1698765432000
}
```

### Commands

1. **WRITE** - Store data
2. **READ** - Retrieve data by key
3. **DELETE** - Remove data
4. **LIST** - List all keys
5. **QUERY** - Search data
6. **STATS** - Get database statistics

---

## 🌉 Phase 4: Bridge Server

### Node.js Bridge Server

**bridge-server/server.js:**
```javascript
const express = require('express');
const net = require('net');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuration
const MINECRAFT_HOST = process.env.MINECRAFT_HOST || 'localhost';
const MINECRAFT_PORT = process.env.MINECRAFT_PORT || 25566;
const MINECRAFT_TOKEN = process.env.MINECRAFT_AUTH_TOKEN;
const BRIDGE_PORT = process.env.BRIDGE_PORT || 3001;

// Socket pool for Minecraft connections
class MinecraftConnection {
  constructor() {
    this.socket = null;
    this.pendingRequests = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(MINECRAFT_PORT, MINECRAFT_HOST, () => {
        console.log('Connected to Minecraft server');
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleResponse(data);
      });

      this.socket.on('error', (err) => {
        console.error('Socket error:', err);
        reject(err);
      });
    });
  }

  async sendCommand(command, data) {
    const id = crypto.randomUUID();
    const message = JSON.stringify({
      id,
      auth: MINECRAFT_TOKEN,
      command,
      data
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
      const response = JSON.parse(data.toString());
      const pending = this.pendingRequests.get(response.id);
      
      if (pending) {
        this.pendingRequests.delete(response.id);
        if (response.success) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error));
        }
      }
    } catch (err) {
      console.error('Error parsing response:', err);
    }
  }
}

const minecraft = new MinecraftConnection();

// API Endpoints

app.post('/mcdb/write', async (req, res) => {
  try {
    const { key, value } = req.body;
    const response = await minecraft.sendCommand('WRITE', { key, value });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/mcdb/read/:key', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('READ', { 
      key: req.params.key 
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/mcdb/delete/:key', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('DELETE', { 
      key: req.params.key 
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/mcdb/list', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('LIST', {});
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/mcdb/stats', async (req, res) => {
  try {
    const response = await minecraft.sendCommand('STATS', {});
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
minecraft.connect().then(() => {
  app.listen(BRIDGE_PORT, () => {
    console.log(`Bridge server running on port ${BRIDGE_PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to Minecraft:', err);
  process.exit(1);
});
```

---

## 🔐 Security Considerations

### 1. Authentication
- Use strong auth tokens
- Rotate tokens regularly
- Implement rate limiting

### 2. Network Security
- **Option A: Local Only** (Recommended)
  - No port forwarding needed
  - Bridge and Minecraft on same machine
  - Firewall blocks external access

- **Option B: Port Forwarded**
  - Enable TLS/SSL encryption
  - IP whitelist
  - VPN access only
  - DDoS protection

### 3. Data Protection
- Encrypt sensitive data before storing
- Backup chunks regularly
- Prevent unauthorized world access

---

## 📊 Capacity Planning

### Storage Capacity

**4x4 Chunk Area (64x64 blocks, Y=5-250):**
- Total blocks: 64 × 64 × 245 = **999,680 blocks**
- Simple encoding: 2 blocks per byte = **499,840 bytes (~488 KB)**
- With overhead (50 blocks per entry): **~9,996 entries**

**Scalability:**
- Increase chunk area (e.g., 16x16 chunks = ~31 MB)
- Use multiple worlds
- Implement compression
- Use advanced encoding (double capacity)

### Performance

**Expected Operations:**
- Write: 50-100ms (async)
- Read: 20-50ms (cached)
- List: 100-200ms
- Capacity: ~100 operations/second

---

## 🚀 Implementation Steps

### Week 1: Foundation
1. ✅ Set up Maven project
2. ✅ Create basic plugin structure
3. ✅ Implement chunk loading/management
4. ✅ Create configuration system

### Week 2: Core Database
1. ⬜ Implement block encoding
2. ⬜ Create address mapping system
3. ⬜ Build read/write operations
4. ⬜ Add data persistence

### Week 3: Socket Communication
1. ⬜ Create socket server
2. ⬜ Implement protocol parser
3. ⬜ Add authentication
4. ⬜ Handle concurrent connections

### Week 4: Bridge & Integration
1. ⬜ Build Node.js bridge server
2. ⬜ Create API endpoints
3. ⬜ Integrate with website
4. ⬜ Testing and optimization

---

## 🧪 Testing Plan

### Unit Tests
- Block encoding/decoding
- Address mapping
- Data serialization

### Integration Tests
- Socket communication
- Bridge server API
- End-to-end data flow

### Load Tests
- Concurrent connections
- Large data writes
- Cache performance

---

## 📝 Usage Example

### From Website (JavaScript)

```javascript
// Store user preference
async function savePreference(userId, data) {
  const response = await fetch('http://localhost:3001/mcdb/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: `user_${userId}_prefs`,
      value: btoa(JSON.stringify(data))
    })
  });
  return await response.json();
}

// Retrieve user preference
async function loadPreference(userId) {
  const response = await fetch(`http://localhost:3001/mcdb/read/user_${userId}_prefs`);
  const data = await response.json();
  return JSON.parse(atob(data.data.value));
}
```

---

## 🎯 Next Actions

1. **Choose Development Path:**
   - Start with plugin development
   - Or build bridge server first
   - Or implement in parallel

2. **Set Up Development Environment:**
   - Install Java JDK 17+
   - Install Maven
   - Set up Minecraft test server

3. **Begin Implementation:**
   - Would you like me to generate the actual Java code?
   - Should I create the bridge server?
   - Want to start with a specific component?

---

## 📚 Additional Resources

- [Spigot API Docs](https://hub.spigotmc.org/javadocs/spigot/)
- [Paper API Docs](https://docs.papermc.io/)
- [Chunk Loading Guide](https://www.spigotmc.org/wiki/chunks/)
- [Maven Tutorial](https://maven.apache.org/guides/)

---

**Status:** Planning Complete ✅  
**Ready for Implementation:** Yes 🚀  
**Estimated Complexity:** Medium-High  
**Estimated Time:** 3-4 weeks for full implementation

