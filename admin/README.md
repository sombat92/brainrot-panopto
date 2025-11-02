# 🔧 Admin Scripts

This folder contains **administrative scripts** for managing the Brainrot Panopto server.  
These scripts are **not deployed** with the application - they run locally to setup and manage the system.

## 📝 Scripts Overview

### 1. `bulk-upload-reels.js`
**Purpose:** Batch upload multiple reels from a folder to Cloudflare R2

**Usage:**
```bash
node admin/bulk-upload-reels.js /path/to/reels/folder
```

---

### 2. `sync-to-minecraft.js`
**Purpose:** Sync existing R2 files to Minecraft database

**Usage:**
```bash
node admin/sync-to-minecraft.js
```

---

### 3. `view-minecraft-db.js`
**Purpose:** View contents of Minecraft database

**Usage:**
```bash
node admin/view-minecraft-db.js
```

---

### 4. `test-brainrot-metadata.js`
**Purpose:** Test the brainrot metadata system

**Usage:**
```bash
node admin/test-brainrot-metadata.js
```

---

### 5. `test-minecraft-flow.js`
**Purpose:** Test complete data flow from R2 → Minecraft → Frontend

**Usage:**
```bash
node admin/test-minecraft-flow.js
```

---

### 6. `brainrot-content-generator.js`
**Purpose:** Generate brainrot usernames and descriptions

**Usage:**
```bash
node admin/brainrot-content-generator.js 10
```

---

### 7. `deploy-plugin.sh` ⭐ NEW
**Purpose:** Automatically deploy the Minecraft plugin to your server

**Usage:**
```bash
./admin/deploy-plugin.sh
```

**What it does:**
- Searches common locations for your Minecraft server
- Builds the plugin if needed
- Copies plugin to server's plugins folder
- Shows next steps

**Example:**
```bash
chmod +x admin/deploy-plugin.sh
./admin/deploy-plugin.sh

# If server not found, it will ask you:
# "Please enter the path to your Minecraft server directory:"
# Enter: /Users/michael/minecraft-server
```

---

### 8. `minecraft-setup.sh` ⭐ NEW
**Purpose:** Complete Minecraft server setup from scratch

**Usage:**
```bash
./admin/minecraft-setup.sh
```

**What it does:**
- Downloads Paper server (1.20.4)
- Creates optimized server.properties
- Installs database plugin
- Creates start/stop scripts
- Configures plugin settings

**Perfect for first-time setup!**

**Example:**
```bash
chmod +x admin/minecraft-setup.sh
./admin/minecraft-setup.sh

# Choose installation location (default: ~/minecraft-server)
# Wait for setup to complete
# Start server with: cd ~/minecraft-server && ./start.sh
```

---

## 🚀 Quick Start Workflows

### First Time Setup (No Minecraft Server)

```bash
# 1. Run complete setup
./admin/minecraft-setup.sh

# 2. Start the server
cd ~/minecraft-server  # (or your chosen path)
./start.sh

# 3. Wait for server to start, then join in Minecraft
# 4. In-game, run:
/op YourUsername
/dbadmin add YourUsername
/dbview all
```

---

### Deploy Plugin to Existing Server

```bash
# 1. Build and deploy plugin
./admin/deploy-plugin.sh

# 2. Restart your Minecraft server

# 3. In-game, grant yourself access:
/dbadmin add YourUsername
/dbview all
```

---

### Upload Reels and Sync

```bash
# 1. Upload reels to R2
node admin/bulk-upload-reels.js ./my-reels

# 2. They automatically sync to Minecraft (if auto-sync enabled)
# Or manually sync:
node admin/sync-to-minecraft.js

# 3. View in Minecraft:
/dbview reels
```

---

### Check Everything is Working

```bash
# Test brainrot system
node admin/test-brainrot-metadata.js

# Test complete flow
node admin/test-minecraft-flow.js

# View database contents
node admin/view-minecraft-db.js
```

---

## 📍 Finding Your Minecraft Server

The `deploy-plugin.sh` script automatically searches these locations:

```
~/minecraft
~/minecraft-server
~/Documents/minecraft
~/Desktop/minecraft
/Users/michael/minecraft
/Users/michael/minecraft-server
```

If your server is elsewhere, you can:

**Option 1:** Move it to a standard location
```bash
mv /path/to/your/server ~/minecraft-server
```

**Option 2:** Create a symlink
```bash
ln -s /path/to/your/server ~/minecraft-server
```

**Option 3:** Provide path when prompted
```bash
./admin/deploy-plugin.sh
# Enter: /path/to/your/server
```

---

## 🎮 Minecraft Server Commands

Once plugin is installed:

### Admin Commands (OP only)
```bash
/dbadmin add <player>      # Make player an admin
/dbadmin remove <player>   # Remove admin
/dbadmin list              # List admins
```

### Access Management (Admin/OP)
```bash
/dbaccess grant <player>   # Grant database access
/dbaccess revoke <player>  # Revoke access
/dbaccess list             # List users with access
```

### User Commands (With access)
```bash
/dbview reels              # View reels database
/dbview lectures           # View lectures database
/dbview notes              # View notes database
/dbview all                # View all regions

/dbteleport reels          # Teleport to reels
/dbtp lectures             # Alias: teleport to lectures
/dbt notes 0 0             # Teleport to notes at X=0, Z=0
```

---

## 🔧 Troubleshooting

### Plugin not loading
```bash
# Rebuild and redeploy
cd minecraft-database/plugin
mvn clean package
./admin/deploy-plugin.sh
# Restart server
```

### Can't find server
```bash
# Check if plugins folder exists
ls ~/minecraft-server/plugins

# If not, run setup
./admin/minecraft-setup.sh
```

### Teleport commands not working
The plugin provides custom teleport that works on Fabric/Paper.
Use `/dbteleport` instead of `/tp`:
```bash
/dbteleport reels      # Works everywhere
/dbview all            # Also works everywhere
```

### No permission errors
```bash
# In Minecraft, as OP:
/op YourUsername
/dbadmin add YourUsername
/dbaccess grant YourUsername
```

---

## 📚 Documentation

- **[DATABASE_ACCESS.md](../minecraft-database/DATABASE_ACCESS.md)** - Complete command reference
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System overview
- **[AUTO_SYNC_FEATURE.md](../NOTES/AUTO_SYNC_FEATURE.md)** - Auto-sync documentation
- **[QUICK_START_BRAINROT.md](../NOTES/QUICK_START_BRAINROT.md)** - Brainrot features

---

## ⚡ Quick Reference

```bash
# Setup new server
./admin/minecraft-setup.sh

# Deploy plugin
./admin/deploy-plugin.sh

# Upload reels
node admin/bulk-upload-reels.js ./reels

# Sync to Minecraft
node admin/sync-to-minecraft.js

# View database
node admin/view-minecraft-db.js

# Test system
node admin/test-brainrot-metadata.js
```

---

## 🎉 Summary

This admin folder now contains:
- ✅ Upload and sync scripts
- ✅ Testing utilities
- ✅ Content generators
- ✅ **Automatic plugin deployment** ⭐
- ✅ **Complete server setup** ⭐

**No more manual plugin copying!** Just run the scripts! 🚀
