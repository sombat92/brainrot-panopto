# 🌌 Void World Setup for Minecraft Database Testing

## Why Void World?

A void world is perfect for testing the Minecraft Database:
- ✅ No terrain to interfere with database chunks
- ✅ Easy to see database blocks (colored patterns)
- ✅ Faster server startup (no terrain generation)
- ✅ Reduced lag and memory usage
- ✅ Clean testing environment

---

## 🚀 Quick Setup

### Method 1: Flat Void World (Easiest)

This creates a completely flat, empty world at Y=64.

**1. Create `bukkit.yml` configuration:**

```yaml
worlds:
  world:
    generator: flat
settings:
  allow-end: false
  warn-on-overload: true
  permissions-file: permissions.yml
  update-folder: update
  plugin-profiling: false
  connection-throttle: 4000
  query-plugins: true
  deprecated-verbose: default
  shutdown-message: Server closed
```

**2. Configure flat world in `server.properties`:**

```properties
level-type=flat
generator-settings=minecraft\:air;minecraft\:air
```

### Method 2: Complete Void World (Most Control)

This creates a truly empty void world with nothing but air.

**1. Install Multiverse-Core plugin:**

```bash
cd ~/minecraft-server/plugins
curl -o Multiverse-Core.jar https://dev.bukkit.org/projects/multiverse-core/files/latest
```

**2. Start server, then run these commands:**

```bash
# In Minecraft console
multiverse create database_world NORMAL -g VoidGenerator
multiverse tp database_world
```

---

## 📝 Step-by-Step: Void World with Bukkit

### Complete Setup

```bash
# 1. Create server directory
mkdir -p ~/minecraft-server-void
cd ~/minecraft-server-void

# 2. Download Paper
curl -o paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/497/downloads/paper-1.20.4-497.jar

# 3. Create server.properties with void settings
cat > server.properties << 'EOF'
level-name=world
level-type=flat
generator-settings=minecraft\:air
gamemode=creative
difficulty=peaceful
spawn-protection=0
max-players=10
online-mode=false
pvp=false
spawn-monsters=false
spawn-animals=false
spawn-npcs=false
view-distance=4
motd=Minecraft Database Test Server
EOF

# 4. Accept EULA
echo "eula=true" > eula.txt

# 5. Create bukkit.yml for flat generation
cat > bukkit.yml << 'EOF'
settings:
  allow-end: false
  warn-on-overload: true
  permissions-file: permissions.yml
  update-folder: update
  shutdown-message: Server closed
worlds:
  world:
    generator: flat
EOF

# 6. Start server (first time)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
java -Xmx2G -Xms1G -jar paper.jar --nogui

# Wait for world generation, then stop (type "stop")

# 7. Install Minecraft Database plugin
cp ~/Documents/Home/brainrot-panopto/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar plugins/

# 8. Configure plugin for void world
mkdir -p plugins/MinecraftDatabase
cat > plugins/MinecraftDatabase/config.yml << 'EOF'
socket:
  enabled: true
  host: "0.0.0.0"
  port: 25566
  auth-token: "minecraft-db-test-token-change-in-production"
  max-connections: 10
  timeout-seconds: 30

database:
  world: "world"
  chunks:
    start-x: 0
    start-z: 0
    end-x: 3
    end-z: 3
  storage:
    min-y: 64
    max-y: 128
    encoding: "simple"
    compression: true
  protection:
    prevent-player-access: true
    prevent-explosions: true
    prevent-block-updates: true
    prevent-mob-spawning: true
    teleport-distance: 100

logging:
  level: "INFO"
  log-operations: true
  log-socket-connections: true
  log-performance: false

performance:
  async-operations: true
  batch-writes: true
  cache-size: 1000
  cache-ttl-seconds: 300
  auto-save-interval: 6000

maintenance:
  auto-cleanup-days: 0
  defragment-on-startup: false
EOF

# 9. Start server again
java -Xmx2G -Xms1G -jar paper.jar --nogui
```

---

## 🎮 Void World Configuration Options

### Super Flat Void (Recommended for Testing)

**server.properties:**
```properties
level-type=flat
# Creates void at Y=64
generator-settings=minecraft\:air

# OR for classic superflat (single grass layer):
generator-settings=minecraft\:bedrock,2*minecraft\:dirt,minecraft\:grass_block;minecraft\:plains

# OR for minimal void with single platform:
generator-settings=3*minecraft\:air,minecraft\:stone;minecraft\:plains
```

### Custom Flat Layers

You can customize what blocks appear:

```
Format: [block_count]*[block_type],[block_count]*[block_type],...

Examples:
- minecraft\:air                    → Complete void
- minecraft\:stone                  → Single stone layer at Y=0
- minecraft\:bedrock,64*minecraft\:air → Bedrock floor, air above
- 3*minecraft\:glass,minecraft\:air → Glass platform at Y=3
```

---

## 🔧 Optimized Configuration for Database Testing

### server.properties (Minimal)

```properties
# World settings
level-name=world
level-type=flat
generator-settings=minecraft\:air
gamemode=creative
difficulty=peaceful

# Performance
view-distance=4
simulation-distance=4
entity-broadcast-range-percentage=50

# Features (disabled for testing)
spawn-monsters=false
spawn-animals=false
spawn-npcs=false
generate-structures=false

# Other
spawn-protection=0
online-mode=false
pvp=false
white-list=false
max-players=5
motd=§6Minecraft Database Test Server
```

### spigot.yml (Performance)

```yaml
world-settings:
  default:
    verbose: false
    mob-spawn-range: 0
    entity-activation-range:
      animals: 0
      monsters: 0
      raiders: 0
      misc: 0
    view-distance: 4
    simulation-distance: 4
    merge-radius:
      item: 4.0
      exp: 6.0
```

---

## 🎨 Creating a Visible Testing Platform

If you want a platform to stand on while testing:

### Option 1: Manual Platform (In-Game)

```bash
# After joining the server, run:
/fill ~-10 63 ~-10 ~10 63 ~10 minecraft:glass
```

This creates a 21×21 glass platform.

### Option 2: Pre-Generated Platform

Add to your world generation:

```properties
# In server.properties
generator-settings=minecraft\:bedrock,62*minecraft\:air,minecraft\:glass;minecraft\:plains
```

This creates:
- Bedrock at Y=0
- Air from Y=1-62
- Glass platform at Y=63

---

## 📦 Complete Automated Setup Script

Save as `setup-void-world.sh`:

```bash
#!/bin/bash

echo "🌌 Setting up Minecraft Void World for Database Testing"

# Configuration
SERVER_DIR="$HOME/minecraft-server-void"
PLUGIN_PATH="$HOME/Documents/Home/brainrot-panopto/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar"

# Create directory
mkdir -p "$SERVER_DIR"
cd "$SERVER_DIR"

# Download Paper if not exists
if [ ! -f "paper.jar" ]; then
    echo "📥 Downloading Paper server..."
    curl -o paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/497/downloads/paper-1.20.4-497.jar
fi

# Create EULA
echo "✅ Accepting EULA..."
echo "eula=true" > eula.txt

# Create server.properties
echo "⚙️ Creating server.properties..."
cat > server.properties << 'EOF'
level-name=world
level-type=flat
generator-settings=minecraft\:bedrock,62*minecraft\:air,minecraft\:glass
gamemode=creative
difficulty=peaceful
spawn-protection=0
max-players=5
online-mode=false
pvp=false
spawn-monsters=false
spawn-animals=false
spawn-npcs=false
generate-structures=false
view-distance=4
simulation-distance=4
motd=§6§lMinecraft Database Test Server
EOF

# Create bukkit.yml
echo "⚙️ Creating bukkit.yml..."
cat > bukkit.yml << 'EOF'
settings:
  allow-end: false
  warn-on-overload: true
worlds:
  world:
    generator: flat
EOF

# First start to generate world
echo "🌍 Generating void world..."
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
timeout 60 java -Xmx2G -Xms1G -jar paper.jar --nogui || true

# Wait a moment
sleep 2

# Create plugins directory
mkdir -p plugins/MinecraftDatabase

# Copy plugin
if [ -f "$PLUGIN_PATH" ]; then
    echo "📦 Installing Minecraft Database plugin..."
    cp "$PLUGIN_PATH" plugins/
    echo "✅ Plugin installed"
else
    echo "⚠️  Plugin not found at: $PLUGIN_PATH"
    echo "    Build it first with: cd minecraft-database/plugin && mvn clean package"
fi

# Create plugin config
echo "⚙️ Creating plugin configuration..."
cat > plugins/MinecraftDatabase/config.yml << 'EOF'
socket:
  enabled: true
  host: "0.0.0.0"
  port: 25566
  auth-token: "minecraft-db-test-token-2024"
  max-connections: 10

database:
  world: "world"
  chunks:
    start-x: 0
    start-z: 0
    end-x: 3
    end-z: 3
  storage:
    min-y: 64
    max-y: 100
    encoding: "simple"
    compression: true
  protection:
    prevent-player-access: true
    prevent-explosions: true
    prevent-block-updates: true
    prevent-mob-spawning: true
    teleport-distance: 50

logging:
  level: "INFO"
  log-operations: true
  log-socket-connections: true

performance:
  async-operations: true
  batch-writes: true
  cache-size: 1000
  cache-ttl-seconds: 300
EOF

echo ""
echo "✅ Void world setup complete!"
echo ""
echo "📁 Server location: $SERVER_DIR"
echo ""
echo "🚀 To start the server:"
echo "   cd $SERVER_DIR"
echo "   export PATH=\"/opt/homebrew/opt/openjdk@17/bin:\$PATH\""
echo "   java -Xmx2G -Xms1G -jar paper.jar --nogui"
echo ""
echo "🎮 Connect in Minecraft:"
echo "   Server address: localhost"
echo "   Game mode: Creative"
echo "   World: Void with glass platform at Y=63"
echo ""
echo "📊 Database location:"
echo "   Chunks: 0,0 to 3,3 (4×4 area)"
echo "   Height: Y=64 to Y=100"
echo "   Coordinates: X: 0-63, Z: 0-63"
echo ""
echo "🧪 Test commands (in Minecraft console):"
echo "   mcdb status"
echo "   mcdb test"
echo "   mcdb info"
echo ""
```

---

## 🎯 Testing Your Void World

### 1. Join the Server

In Minecraft:
- Multiplayer → Add Server
- Address: `localhost`
- Join

You should spawn on a glass platform in a void!

### 2. Find the Database Area

```bash
# Teleport to database chunks
/tp 32 65 32
```

This puts you in the center of the database area (chunks 0,0 to 3,3).

### 3. View Database Blocks

After writing data through the API, you'll see colored blocks appear:
- Different colored wool
- Different types of wood planks
- Different types of stone

Each block represents 4 bits of data!

### 4. Test Commands

```bash
# In server console
mcdb status      # Check if running
mcdb test        # Write/read/delete test
mcdb info        # Database capacity and usage
```

---

## 🔍 Visualizing Your Data

### Option 1: Spectator Mode

```bash
/gamemode spectator
/tp 32 65 32
```

Fly through the database chunks to see all the blocks.

### Option 2: WorldEdit (Optional)

Install WorldEdit to see the exact block composition:

```bash
//pos1
//pos2
//count wool
//count planks
```

---

## 📊 Database Layout in Void World

```
Void World (Y=0 to Y=256)
│
├── Y=0:     Bedrock (floor)
├── Y=1-62:  Air (void)
├── Y=63:    Glass platform (spawn area)
├── Y=64-100: DATABASE STORAGE ⭐
│            Chunks 0,0 to 3,3
│            4×4 chunk area (64×64 blocks)
│            Colored blocks = your data!
└── Y=101+:  Air

Database Coordinates:
- X: 0 to 63 (4 chunks × 16 blocks)
- Z: 0 to 63 (4 chunks × 16 blocks)
- Y: 64 to 100 (37 layers)

Total Capacity: 64 × 64 × 37 = 151,552 blocks
```

---

## 🎨 Seeing Your Data

When you write data, you'll see patterns like:

```
Example: Writing "Hello World"
┌────────────────────────────┐
│ 🟧 Orange Wool  (H)        │
│ 🟪 Purple Wool  (e)        │
│ 🟩 Lime Wool    (l)        │
│ 🟦 Blue Wool    (l)        │
│ 🟨 Yellow Wool  (o)        │
│ ⬜ White Wool   (space)    │
│ 🌲 Oak Planks   (W)        │
│ 🌳 Spruce       (o)        │
└────────────────────────────┘
```

Each byte is 2 blocks, so you can literally see your data!

---

## 🚀 Quick Start Command

```bash
# One-liner to set up everything
curl -sL https://raw.githubusercontent.com/YOUR_REPO/setup-void-world.sh | bash

# Or use the script above
chmod +x setup-void-world.sh
./setup-void-world.sh
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Server starts without errors
- [ ] World is void (no terrain)
- [ ] Glass platform exists at Y=63
- [ ] Plugin loads successfully (`/plugins`)
- [ ] Database chunks are loaded (`mcdb status`)
- [ ] Can teleport to database area (`/tp 32 65 32`)
- [ ] Test command works (`mcdb test`)

---

## 🎓 Next Steps

1. **Start void world server**
2. **Configure bridge server** with matching auth token
3. **Write data via API**
4. **Join Minecraft** and teleport to database
5. **See your data** as colored blocks!

---

**Perfect for testing and development!** 🌌

See BUILD_SUCCESS.md for deploying the full system.

