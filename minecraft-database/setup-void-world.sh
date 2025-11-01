#!/bin/bash

echo "🌌 Setting up Minecraft Void World for Database Testing"
echo ""

# Configuration
SERVER_DIR="$HOME/minecraft-server-void"
PLUGIN_PATH="$HOME/Documents/Home/brainrot-panopto/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar"

# Create directory
echo "📁 Creating server directory..."
mkdir -p "$SERVER_DIR"
cd "$SERVER_DIR"

# Download Paper if not exists
if [ ! -f "paper.jar" ]; then
    echo "📥 Downloading Paper server (this may take a minute)..."
    curl -L -o paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/497/downloads/paper-1.20.4-497.jar
    echo "✅ Downloaded Paper server"
else
    echo "✅ Paper server already downloaded"
fi

# Create EULA
echo "📜 Accepting EULA..."
echo "eula=true" > eula.txt

# Create server.properties
echo "⚙️  Creating server.properties..."
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
enable-command-block=true
motd=§6§lMinecraft Database Test Server
server-port=25565
EOF

# Create bukkit.yml
echo "⚙️  Creating bukkit.yml..."
cat > bukkit.yml << 'EOF'
settings:
  allow-end: false
  warn-on-overload: true
  shutdown-message: "§cServer closed"
worlds:
  world:
    generator: flat
EOF

# Create spigot.yml for performance
echo "⚙️  Creating spigot.yml..."
cat > spigot.yml << 'EOF'
settings:
  debug: false
  save-user-cache-on-stop-only: false
world-settings:
  default:
    verbose: false
    mob-spawn-range: 0
    entity-activation-range:
      animals: 0
      monsters: 0
      raiders: 0
      misc: 0
      water: 0
      villagers: 0
      flying-monsters: 0
    view-distance: 4
    simulation-distance: 4
    merge-radius:
      item: 4.0
      exp: 6.0
    growth:
      cactus-modifier: 0
      cane-modifier: 0
      melon-modifier: 0
      mushroom-modifier: 0
      pumpkin-modifier: 0
      sapling-modifier: 0
      beetroot-modifier: 0
      carrot-modifier: 0
      potato-modifier: 0
      wheat-modifier: 0
      netherwart-modifier: 0
      vine-modifier: 0
      cocoa-modifier: 0
      bamboo-modifier: 0
      sweetberry-modifier: 0
      kelp-modifier: 0
EOF

# First start to generate world
echo ""
echo "🌍 Generating void world (this will take 30-60 seconds)..."
echo "    The server will start and stop automatically..."
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Start server with timeout
timeout 60 java -Xmx2G -Xms1G -jar paper.jar --nogui > /dev/null 2>&1 || true

# Wait for files to be written
sleep 3

# Create plugins directory
mkdir -p plugins/MinecraftDatabase

# Copy plugin
if [ -f "$PLUGIN_PATH" ]; then
    echo "📦 Installing Minecraft Database plugin..."
    cp "$PLUGIN_PATH" plugins/
    echo "✅ Plugin installed: MinecraftDatabase-1.0.0.jar"
else
    echo "⚠️  Plugin not found at: $PLUGIN_PATH"
    echo "    Build it first with:"
    echo "    cd ~/Documents/Home/brainrot-panopto/minecraft-database/plugin"
    echo "    mvn clean package"
    echo ""
fi

# Create plugin config
echo "⚙️  Creating plugin configuration..."
cat > plugins/MinecraftDatabase/config.yml << 'EOF'
# Minecraft Database Plugin Configuration
socket:
  enabled: true
  host: "0.0.0.0"
  port: 25566
  auth-token: "minecraft-db-test-token-2024"
  max-connections: 10
  timeout-seconds: 30

database:
  world: "world"
  
  # Database storage area (4×4 chunks in void world)
  chunks:
    start-x: 0
    start-z: 0
    end-x: 3
    end-z: 3
  
  storage:
    min-y: 64      # Just above glass platform
    max-y: 100     # Good height for testing
    encoding: "simple"
    compression: true
    blocks-per-key: 16
    blocks-per-value: 32
  
  # Protection for database chunks
  protection:
    prevent-player-access: true
    prevent-explosions: true
    prevent-block-updates: true
    prevent-mob-spawning: true
    teleport-distance: 50

# Logging
logging:
  level: "INFO"
  log-operations: true
  log-socket-connections: true
  log-performance: false

# Performance
performance:
  async-operations: true
  batch-writes: true
  cache-size: 1000
  cache-ttl-seconds: 300
  auto-save-interval: 6000

# Maintenance
maintenance:
  auto-cleanup-days: 0
  defragment-on-startup: false
EOF

# Create start script
echo "📝 Creating start script..."
cat > start.sh << 'EOF'
#!/bin/bash
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
java -Xmx2G -Xms1G -jar paper.jar --nogui
EOF
chmod +x start.sh

# Create README
cat > README.txt << 'EOF'
Minecraft Database Test Server - Void World
============================================

This is a void world optimized for testing the Minecraft Database plugin.

WORLD LAYOUT:
- Y=0:      Bedrock floor
- Y=1-62:   Void (air)
- Y=63:     Glass platform (spawn point)
- Y=64-100: DATABASE STORAGE (4×4 chunks)
- Y=101+:   Air

DATABASE LOCATION:
- Chunks: 0,0 to 3,3
- Coordinates: X: 0-63, Z: 0-63, Y: 64-100
- Center: /tp 32 65 32

TO START SERVER:
  ./start.sh

TO STOP SERVER:
  Type "stop" in console

TESTING:
1. Start server: ./start.sh
2. In console: mcdb test
3. Join Minecraft (localhost)
4. Teleport to database: /tp 32 65 32
5. See your data as colored blocks!

CONNECT TO SERVER:
- Address: localhost
- Port: 25565
- Mode: Creative
- World: Void

BRIDGE SERVER:
- Update minecraft-database/bridge-server/.env
- Set MINECRAFT_AUTH_TOKEN="minecraft-db-test-token-2024"
- Run: npm start

COMMANDS:
  mcdb status  - Check database status
  mcdb test    - Run test write/read/delete
  mcdb info    - Show capacity and usage
  mcdb clear   - Clear all data
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VOID WORLD SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Server location: $SERVER_DIR"
echo ""
echo "🚀 TO START THE SERVER:"
echo "   cd $SERVER_DIR"
echo "   ./start.sh"
echo ""
echo "🎮 TO CONNECT IN MINECRAFT:"
echo "   Multiplayer → Add Server"
echo "   Address: localhost"
echo "   Mode: Creative"
echo ""
echo "🌌 WORLD INFO:"
echo "   Type: Void (empty)"
echo "   Platform: Glass at Y=63"
echo "   Database: Y=64-100, Chunks 0,0 to 3,3"
echo ""
echo "📊 DATABASE LOCATION:"
echo "   Coordinates: X: 0-63, Z: 0-63"
echo "   Center: /tp 32 65 32"
echo ""
echo "🧪 TEST COMMANDS (in server console):"
echo "   mcdb status"
echo "   mcdb test"
echo "   mcdb info"
echo ""
echo "🔐 AUTH TOKEN:"
echo "   minecraft-db-test-token-2024"
echo "   (Update in bridge-server/.env)"
echo ""
echo "📚 Documentation:"
echo "   - VOID_WORLD_SETUP.md"
echo "   - BUILD_SUCCESS.md"
echo "   - MINECRAFT_SETUP_GUIDE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

