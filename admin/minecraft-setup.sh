#!/bin/bash

# Minecraft Server Quick Setup Script
# Downloads and sets up a Paper server with the database plugin

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Minecraft Server Setup with Database    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ask where to install
echo -e "${YELLOW}Where would you like to install the Minecraft server?${NC}"
echo -e "${YELLOW}(Press Enter for default: ~/minecraft-server)${NC}"
read -p "Path: " INSTALL_PATH

if [ -z "$INSTALL_PATH" ]; then
    INSTALL_PATH="$HOME/minecraft-server"
fi

# Expand tilde
INSTALL_PATH="${INSTALL_PATH/#\~/$HOME}"

# Create directory
echo -e "${BLUE}📁 Creating server directory: $INSTALL_PATH${NC}"
mkdir -p "$INSTALL_PATH"
cd "$INSTALL_PATH"

# Download Paper server (1.20.4)
echo -e "${BLUE}📥 Downloading Paper server (1.20.4)...${NC}"
if [ ! -f "server.jar" ]; then
    curl -o server.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/497/downloads/paper-1.20.4-497.jar
fi

# Create eula.txt
echo -e "${BLUE}📝 Creating eula.txt...${NC}"
echo "eula=true" > eula.txt

# Create server.properties
if [ ! -f "server.properties" ]; then
    echo -e "${BLUE}📝 Creating server.properties...${NC}"
    cat > server.properties << 'EOF'
# Minecraft Server Properties (Database-optimized)
level-name=database_world
gamemode=creative
difficulty=peaceful
spawn-protection=0
max-players=10
online-mode=false
enable-command-block=true
level-seed=flatworld
level-type=flat
generator-settings=minecraft:air;minecraft:bedrock
pvp=false
view-distance=10
simulation-distance=10
max-world-size=1000
EOF
fi

# Create plugins directory
mkdir -p plugins

# Copy database plugin
echo -e "${BLUE}📦 Installing MinecraftDatabase plugin...${NC}"
PLUGIN_JAR="$SCRIPT_DIR/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar"

if [ ! -f "$PLUGIN_JAR" ]; then
    echo -e "${YELLOW}⚠️  Plugin not built yet. Building...${NC}"
    cd "$SCRIPT_DIR/minecraft-database/plugin"
    mvn clean package
    cd "$INSTALL_PATH"
fi

cp "$PLUGIN_JAR" plugins/MinecraftDatabase-1.0.0.jar

# Create start script
echo -e "${BLUE}📝 Creating start script...${NC}"
cat > start.sh << 'EOF'
#!/bin/bash
java -Xms2G -Xmx4G -jar server.jar nogui
EOF
chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash
screen -S minecraft -X stuff "stop\n"
EOF
chmod +x stop.sh

# Create config for plugin
mkdir -p plugins/MinecraftDatabase
cat > plugins/MinecraftDatabase/config.yml << 'EOF'
# Minecraft Database Configuration
database:
  world: database_world
  chunk-area:
    start-x: 0
    start-z: 0
    end-x: 3
    end-z: 3
  y-range:
    min: 0
    max: 255
  encoding: simple

socket:
  enabled: true
  port: 25566
  host: 0.0.0.0
  auth-token: change-me-in-production-please
  max-connections: 10
EOF

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✓ Setup Complete!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📍 Server Location:${NC} $INSTALL_PATH"
echo ""
echo -e "${YELLOW}🚀 To start the server:${NC}"
echo -e "   cd $INSTALL_PATH"
echo -e "   ./start.sh"
echo ""
echo -e "${YELLOW}🛑 To stop the server:${NC}"
echo -e "   ./stop.sh"
echo ""
echo -e "${YELLOW}📋 First-time setup (in Minecraft):${NC}"
echo -e "   1. Join the server"
echo -e "   2. Run: ${GREEN}/op YourUsername${NC}"
echo -e "   3. Run: ${GREEN}/dbadmin add YourUsername${NC}"
echo -e "   4. Run: ${GREEN}/dbview all${NC}"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo -e "   $SCRIPT_DIR/minecraft-database/DATABASE_ACCESS.md"
echo ""

