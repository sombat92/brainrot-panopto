# 🎮 Minecraft Database Setup Guide

Complete step-by-step guide to get your Minecraft block database running.

## 📋 Prerequisites

### Step 1: Install Java 17

**macOS:**
```bash
# Install using Homebrew (recommended)
brew install openjdk@17

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
```

**Alternative - Download from Oracle:**
- Visit: https://www.oracle.com/java/technologies/downloads/#java17
- Download "macOS Installer"
- Run the installer

### Step 2: Install Maven

**macOS:**
```bash
# Install using Homebrew
brew install maven

# Verify installation
mvn -version
```

---

## 🏗️ Step-by-Step Setup

### Part 1: Build the Minecraft Plugin

```bash
cd /Users/michael/Documents/Home/brainrot-panopto/minecraft-database/plugin

# Build the plugin
mvn clean package

# The JAR will be created at:
# target/MinecraftDatabase-1.0.0.jar
```

**Expected Output:**
```
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

### Part 2: Set Up Minecraft Server

#### Option A: Quick Test (Using Existing Server)

If you have a Minecraft server already:

1. **Copy the plugin:**
```bash
cp target/MinecraftDatabase-1.0.0.jar /path/to/your/minecraft/server/plugins/
```

2. **Start/Restart the server**

3. **Configure the plugin:**
```bash
# Edit the config file
nano plugins/MinecraftDatabase/config.yml
```

#### Option B: Create New Server (From Scratch)

1. **Download Paper server:**
```bash
# Create server directory
mkdir -p ~/minecraft-server
cd ~/minecraft-server

# Download Paper 1.20.4 (recommended over Spigot)
curl -o paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/latest/downloads/paper-1.20.4.jar

# Accept EULA
echo "eula=true" > eula.txt

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
java -Xmx2G -Xms1G -jar paper.jar --nogui
EOF

chmod +x start.sh
```

2. **Start server once to generate files:**
```bash
./start.sh
# Wait for it to finish generating world, then stop it:
# Type "stop" in the console
```

3. **Install the plugin:**
```bash
cp ~/Documents/Home/brainrot-panopto/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar plugins/
```

4. **Start server again:**
```bash
./start.sh
```

---

### Part 3: Configure the Plugin

The plugin will generate `plugins/MinecraftDatabase/config.yml` on first run.

**Edit the configuration:**

```yaml
socket:
  enabled: true
  host: "0.0.0.0"      # Listen on all interfaces
  port: 25566          # Socket port
  auth-token: "your-secret-token-here"  # ⚠️ CHANGE THIS!
  max-connections: 10

database:
  world: "world"       # Your world name
  chunks:
    start-x: 0         # Starting chunk coordinates
    start-z: 0
    end-x: 3           # Ending chunk (4x4 area)
    end-z: 3
  
  storage:
    min-y: 5           # Storage height range
    max-y: 250
    encoding: "simple" # Block encoding type
    compression: true  # Enable GZIP compression
  
  protection:
    prevent-player-access: true    # Protect database area
    prevent-explosions: true
    teleport-distance: 100         # Teleport intruders away
```

**Important Settings:**
- `auth-token`: **MUST CHANGE THIS** for security!
- `world`: Should match your Minecraft world name (usually "world")
- `chunks`: Defines the database storage area
- `protection`: Prevents players from interfering

---

### Part 4: Start the Bridge Server

The bridge server translates HTTP requests to Minecraft socket commands.

```bash
# Navigate to bridge server directory
cd ~/Documents/Home/brainrot-panopto/minecraft-database/bridge-server

# Install dependencies (first time only)
npm install

# Configure the bridge server
# Edit .env file
nano .env
```

**Update `.env` with your settings:**
```bash
MINECRAFT_HOST=localhost        # Or your server IP
MINECRAFT_PORT=25566           # Must match plugin config
MINECRAFT_AUTH_TOKEN=your-secret-token-here  # Must match plugin config!
BRIDGE_PORT=3001               # HTTP API port
```

**Start the bridge server:**
```bash
npm start

# Or for development with auto-reload:
npm run dev
```

**Expected Output:**
```
╔════════════════════════════════════════════╗
║   Minecraft Database Bridge Server        ║
╠════════════════════════════════════════════╣
║   HTTP Server: http://localhost:3001      ║
║   Minecraft: localhost:25566              ║
╚════════════════════════════════════════════╝
✓ Connected to Minecraft server at localhost:25566
```

---

## 🧪 Testing the Integration

### Test 1: Check Plugin Status (In Minecraft)

In your Minecraft server console:
```
mcdb status
```

**Expected Output:**
```
=== MCDB Status ===
Socket Server: Running
Port: 25566
Connections: 1
Chunks Loaded: 16
Entries: 0
Cache Size: 0
```

### Test 2: Run Built-in Test

```
mcdb test
```

**Expected Output:**
```
Running database test...
Write test passed (45ms)
Read test passed (23ms)
Delete test passed (18ms)
All tests completed successfully!
```

### Test 3: Test Bridge Server

```bash
# Check health
curl http://localhost:3001/health

# Write data
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{"key": "test_user", "value": "Hello from Minecraft Database!"}'

# Read data
curl http://localhost:3001/mcdb/read/test_user

# Get stats
curl http://localhost:3001/mcdb/stats
```

### Test 4: View Data In-Game

1. **Join your Minecraft server**
2. **Teleport to database area:**
   ```
   /tp 0 5 0
   ```
3. **You should see colored wool/stone blocks** - that's your data encoded as blocks!

---

## 🎯 Using from Your Website

Once everything is running, integrate with your brainrot-panopto website:

```javascript
// Store user preferences
async function saveUserPreference(userId, preferences) {
  const response = await fetch('http://localhost:3001/mcdb/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: `user_${userId}_prefs`,
      value: JSON.stringify(preferences)
    })
  });
  return await response.json();
}

// Load user preferences
async function loadUserPreference(userId) {
  const response = await fetch(`http://localhost:3001/mcdb/read/user_${userId}_prefs`);
  const data = await response.json();
  return JSON.parse(data.data.value);
}

// Example usage
await saveUserPreference('123', { theme: 'dark', volume: 0.8 });
const prefs = await loadUserPreference('123');
console.log(prefs); // { theme: 'dark', volume: 0.8 }
```

---

## 🎮 Minecraft Commands

All commands require `mcdb.admin` permission (OP by default).

```
/mcdb reload      - Reload configuration
/mcdb status      - Show server status and connections
/mcdb info        - Show database information and capacity
/mcdb test        - Run database test (write/read/delete)
/mcdb clear       - Clear all data (console only for safety)
```

---

## 🔧 Troubleshooting

### Issue: Plugin doesn't load

**Check:**
1. Java version: `java -version` (must be 17+)
2. Server version: Paper/Spigot 1.20.4
3. Console errors: Check `logs/latest.log`

**Solution:**
```bash
# Ensure Java 17
java -version

# Rebuild plugin
cd minecraft-database/plugin
mvn clean package
```

### Issue: Bridge can't connect

**Check:**
1. Minecraft server is running
2. Plugin loaded successfully (`/plugins` in console)
3. Port 25566 is open
4. Auth tokens match

**Solution:**
```bash
# Check if port is open
lsof -i :25566

# Verify plugin loaded
# In Minecraft console:
plugins

# Check bridge logs for errors
```

### Issue: "Access Denied" error

**Problem:** Auth tokens don't match

**Solution:**
```bash
# Make sure these match:
# 1. plugins/MinecraftDatabase/config.yml → socket.auth-token
# 2. bridge-server/.env → MINECRAFT_AUTH_TOKEN

# Both must be EXACTLY the same string!
```

### Issue: No space in database

**Solution:**
```bash
# In Minecraft console:
mcdb clear

# Or expand chunk area in config.yml:
chunks:
  start-x: 0
  start-z: 0
  end-x: 7    # Increase from 3 to 7 (8x8 chunks = 4x capacity)
  end-z: 7
```

---

## 📊 Monitoring

### Check Database Usage

```bash
# In Minecraft console
mcdb info

# Via HTTP
curl http://localhost:3001/mcdb/stats
```

**Output:**
```json
{
  "success": true,
  "data": {
    "entries": 42,
    "capacity": 9996,
    "used_percent": 0,
    "cache_size": 12,
    "chunks": 16
  }
}
```

### View Logs

**Plugin logs:**
```bash
tail -f minecraft-server/logs/latest.log | grep MCDB
```

**Bridge logs:**
```bash
# In the bridge-server terminal
```

---

## 🚀 Production Deployment

### Security Checklist

- [ ] Change default auth token
- [ ] Use strong, random token (32+ characters)
- [ ] Configure firewall (block 25566 externally)
- [ ] Only expose bridge port (3001)
- [ ] Enable HTTPS on bridge server
- [ ] Regular backups of world files
- [ ] Monitor for unauthorized access

### Scaling

**Increase capacity:**
```yaml
chunks:
  start-x: 0
  start-z: 0
  end-x: 15   # 16x16 chunks = 31 MB storage
  end-z: 15
```

**Multiple servers:**
- Run multiple Minecraft instances on different ports
- Load balance via bridge server
- Use different world directories

---

## 📱 Quick Reference

### Ports
- **3000** - Your website (Express)
- **3001** - Bridge server (HTTP API)
- **25566** - Minecraft socket (internal)
- **25565** - Minecraft game (if you want to play)

### Key Files
```
minecraft-database/
├── plugin/target/MinecraftDatabase-1.0.0.jar  # Built plugin
├── bridge-server/server.js                    # Bridge server
├── bridge-server/.env                         # Bridge config
└── README.md                                  # Full documentation

minecraft-server/
├── plugins/MinecraftDatabase-1.0.0.jar       # Installed plugin
├── plugins/MinecraftDatabase/config.yml      # Plugin config
└── world/                                    # World data (includes database)
```

### Useful Links
- Paper MC: https://papermc.io/downloads
- Java Download: https://www.oracle.com/java/technologies/downloads/
- Maven: https://maven.apache.org/download.cgi

---

## ✅ Quick Start Checklist

1. [ ] Install Java 17+
2. [ ] Install Maven
3. [ ] Build plugin: `mvn clean package`
4. [ ] Set up Minecraft server (Paper 1.20.4)
5. [ ] Copy plugin to `plugins/` folder
6. [ ] Start Minecraft server
7. [ ] Configure `plugins/MinecraftDatabase/config.yml`
8. [ ] Change auth token (important!)
9. [ ] Restart Minecraft server
10. [ ] Configure bridge `.env` with same auth token
11. [ ] Install bridge dependencies: `npm install`
12. [ ] Start bridge server: `npm start`
13. [ ] Test with `/mcdb test` in Minecraft
14. [ ] Test HTTP API with curl
15. [ ] Integrate with your website
16. [ ] Celebrate! 🎉

---

## 💡 What's Next?

Once everything is running:

1. **Integrate with your website** - Use HTTP API from JavaScript
2. **Create a dashboard** - Monitor database usage
3. **Add backup system** - Regular world backups
4. **Implement metrics** - Track performance
5. **Scale up** - Expand chunk area for more storage

---

## 🆘 Need Help?

**Check these files:**
1. `IMPLEMENTATION_COMPLETE.md` - Overview of everything built
2. `minecraft-database/README.md` - Complete plugin documentation
3. `MINECRAFT_DATABASE_PLAN.md` - Architecture details

**Common issues:**
- Port already in use: Change port in config
- Can't connect: Check firewall/auth token
- Out of space: Run `/mcdb clear` or expand chunks
- Plugin errors: Check Java version and server logs

---

**Ready to build something amazing with Minecraft as a database!** 🎮💾

