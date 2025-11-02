#!/bin/bash

# Deploy MinecraftDatabase Plugin Script
# Automatically finds and deploys the plugin to your Minecraft server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Minecraft Database Plugin Deployer      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_JAR="$PROJECT_ROOT/minecraft-database/plugin/target/MinecraftDatabase-1.0.0.jar"

# Check if plugin exists
if [ ! -f "$PLUGIN_JAR" ]; then
    echo -e "${RED}❌ Plugin JAR not found!${NC}"
    echo -e "${YELLOW}Building plugin...${NC}"
    cd "$PROJECT_ROOT/minecraft-database/plugin"
    mvn clean package
    
    if [ ! -f "$PLUGIN_JAR" ]; then
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
fi

# Try to find Minecraft server
MINECRAFT_SERVER=""

# Common locations to check
SEARCH_PATHS=(
    "$HOME/minecraft"
    "$HOME/minecraft-server"
    "$HOME/minecraft_server"
    "$HOME/Documents/minecraft"
    "$HOME/Documents/minecraft-server"
    "$HOME/Desktop/minecraft"
    "$HOME/Desktop/minecraft-server"
    "/Users/michael/minecraft"
    "/Users/michael/minecraft-server"
    "$PROJECT_ROOT/../minecraft-server"
)

echo -e "${YELLOW}🔍 Searching for Minecraft server...${NC}"

for path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$path/plugins" ]; then
        MINECRAFT_SERVER="$path"
        echo -e "${GREEN}✓ Found Minecraft server: $MINECRAFT_SERVER${NC}"
        break
    fi
done

# If not found, ask user
if [ -z "$MINECRAFT_SERVER" ]; then
    echo -e "${YELLOW}Could not auto-detect Minecraft server.${NC}"
    echo -e "${YELLOW}Please enter the path to your Minecraft server directory:${NC}"
    read -p "Path: " MINECRAFT_SERVER
    
    # Expand tilde
    MINECRAFT_SERVER="${MINECRAFT_SERVER/#\~/$HOME}"
    
    if [ ! -d "$MINECRAFT_SERVER/plugins" ]; then
        echo -e "${RED}❌ Invalid Minecraft server path (no plugins folder found)${NC}"
        exit 1
    fi
fi

# Deploy plugin
PLUGINS_DIR="$MINECRAFT_SERVER/plugins"
DEST_FILE="$PLUGINS_DIR/MinecraftDatabase-1.0.0.jar"

echo ""
echo -e "${BLUE}📦 Deploying plugin...${NC}"
echo -e "   From: $PLUGIN_JAR"
echo -e "   To:   $DEST_FILE"

# Remove old version if exists
if [ -f "$DEST_FILE" ]; then
    echo -e "${YELLOW}⚠️  Removing old version...${NC}"
    rm "$DEST_FILE"
fi

# Copy new version
cp "$PLUGIN_JAR" "$DEST_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Plugin deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Restart your Minecraft server"
    echo -e "  2. As server OP, run: ${GREEN}/dbadmin add YourUsername${NC}"
    echo -e "  3. Grant access to users: ${GREEN}/dbaccess grant PlayerName${NC}"
    echo -e "  4. Users can view database: ${GREEN}/dbview all${NC}"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo -e "  📖 $PROJECT_ROOT/minecraft-database/DATABASE_ACCESS.md"
    echo ""
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

