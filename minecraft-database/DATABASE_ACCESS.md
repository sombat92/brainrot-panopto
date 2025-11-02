# 🎮 Database Access & Permissions System

## Overview

A comprehensive permission system that allows users to **view and access the Minecraft database** with custom teleport commands that work on Fabric servers!

## 🚀 Deployment Scripts

### Quick Deploy to Existing Server

If you already have a Minecraft server running:

```bash
cd /Users/michael/Documents/Home/brainrot-panopto
./admin/deploy-plugin.sh
```

**What it does:**
- ✅ Auto-detects your Minecraft server (searches `~/minecraft-server`, `~/minecraft`, etc.)
- ✅ Builds the plugin if needed
- ✅ Copies plugin to `plugins/` folder
- ✅ Shows next steps

**Then restart your server and you're done!**

### Complete New Server Setup

Don't have a Minecraft server yet? Set one up in 2 minutes:

```bash
cd /Users/michael/Documents/Home/brainrot-panopto
./admin/minecraft-setup.sh
```

**What it does:**
- ✅ Downloads Paper server (optimized for plugins)
- ✅ Creates flat database world
- ✅ Installs database plugin automatically
- ✅ Generates start/stop scripts
- ✅ Configures optimal settings

**Then:**
```bash
cd ~/minecraft-server  # (or your chosen path)
./start.sh
```

### Finding Your Server

The deployment script searches these locations:
```
~/minecraft
~/minecraft-server
~/Documents/minecraft
~/Desktop/minecraft
/Users/michael/minecraft
```

**Not there?** You can:
1. Move it: `mv /path/to/server ~/minecraft-server`
2. Create symlink: `ln -s /path/to/server ~/minecraft-server`
3. Provide path when prompted

## 🔑 Permission Levels

### 1. Server Operator (OP)
- Full access to everything
- Can manage admins
- Can grant/revoke database access

### 2. Database Admin
- Can grant database access to users
- Cannot create other admins
- Has full database access

### 3. Database User
- Can view database regions
- Can teleport to database areas
- Read-only access to visualize data

## 📋 Commands

### Admin Commands

#### `/dbadmin` - Manage Administrators
**Permission:** Server OP only  
**Usage:**
```
/dbadmin add <player>        # Make player an admin
/dbadmin remove <player>     # Remove admin status
/dbadmin list                # List all admins
```

**Examples:**
```
/dbadmin add Steve
/dbadmin add 069a79f4-44e9-4726-a5be-fca90e38aaf5  # Using UUID
/dbadmin list
/dbadmin remove Steve
```

#### `/dbaccess` - Manage Database Access
**Permission:** Admin or OP  
**Usage:**
```
/dbaccess grant <player>     # Grant database access
/dbaccess revoke <player>    # Revoke database access
/dbaccess list               # List all users with access
```

**Examples:**
```
/dbaccess grant Alex
/dbaccess grant 069a79f4-44e9-4726-a5be-fca90e38aaf5  # Using UUID
/dbaccess list
/dbaccess revoke Alex
```

### User Commands

#### `/dbview` - View Database in Spectator Mode
**Permission:** Database access required  
**Usage:**
```
/dbview <reels|lectures|notes|all>
```

**What it does:**
- Teleports you to the specified database region
- Automatically switches to spectator mode
- Perfect for viewing data without modifying it

**Regions:**
- `reels` - Y: 5-100 (Reel metadata)
- `lectures` - Y: 105-200 (Lecture metadata)
- `notes` - Y: 201-250 (User notes)
- `all` - Y: 125 (Center of all regions)

**Examples:**
```
/dbview reels        # View reels database
/dbview lectures     # View lectures database
/dbview notes        # View notes database
/dbview all          # View all regions from center
```

#### `/dbteleport` - Teleport to Database Region
**Permission:** Database access required  
**Aliases:** `/dbtp`, `/dbt`  
**Usage:**
```
/dbteleport <reels|lectures|notes|all> [x] [z]
```

**What it does:**
- Teleports to specified database region
- Does NOT change gamemode
- Can specify X/Z coordinates

**Examples:**
```
/dbteleport reels            # Teleport to reels center
/dbteleport lectures         # Teleport to lectures center
/dbteleport notes 100 50     # Teleport to notes at X=100, Z=50
/dbtp all                    # Use alias to teleport to center
```

## 🚀 Quick Start Guide

### Step 1: Deploy Plugin

**Option A - Existing Server:**
```bash
./admin/deploy-plugin.sh
# Restart server
```

**Option B - New Server:**
```bash
./admin/minecraft-setup.sh
cd ~/minecraft-server
./start.sh
```

### Step 2: Configure In-Game (Server Operators)

**1. Grant yourself admin status:**
```
/dbadmin add YourUsername
```

**2. Grant database access to users:**
```
/dbaccess grant Steve
/dbaccess grant Alex
```

**3. View who has access:**
```
/dbadmin list
/dbaccess list
```

### Step 3: Explore (Users with Access)

**1. View the database:**
```
/dbview all
```
You'll be teleported and switched to spectator mode.

**2. Navigate regions:**
```
/dbview reels       # See colored blocks representing reels
/dbview lectures    # See lecture metadata
/dbview notes       # See user notes
```

**3. Teleport without changing gamemode:**
```
/dbteleport reels
```

**4. Return to normal gameplay:**
```
/gamemode creative   # or survival
```

## 📊 Database Regions

### Vertical Organization

```
Y=250 ┌──────────────────┐
      │ NOTES DATABASE   │  /dbview notes
      │ Y: 201-250       │  (User notes)
Y=201 ├──────────────────┤
      │                  │
Y=200 │ LECTURES DB      │  /dbview lectures
      │ Y: 105-200       │  (Lecture metadata)
      │                  │
Y=105 ├──────────────────┤
Y=104 │ BUFFER ZONE      │
Y=101 ├──────────────────┤
Y=100 │ REELS DATABASE   │  /dbview reels
      │ Y: 5-100         │  (Reel metadata + brainrot)
      │                  │
Y=5   └──────────────────┘
```

## 🔐 Permissions File

Permissions are stored in `plugins/MinecraftDatabase/permissions.yml`:

```yaml
# Database administrators (can grant access)
admins:
  - Steve
  - 069a79f4-44e9-4726-a5be-fca90e38aaf5

# Users with database access
database-access:
  - Alex
  - Notch
  - jeb_
```

**You can edit this file directly**, then reload with:
```
/mcdb reload
```

## 💡 Use Cases

### Use Case 1: Developer Viewing Data
```
# Developer wants to see how reels are stored
/dbview reels

# Now in spectator mode at Y=52 (center of reels region)
# Can fly through and see colored blocks representing data
```

### Use Case 2: Demonstrating System
```
# Show someone the entire database
/dbview all

# They see all three regions vertically stacked
# Can fly up/down to see different data types
```

### Use Case 3: Debugging Specific Entry
```
# Need to check a specific location
/dbteleport notes 0 0

# Teleport without changing gamemode
# Can now inspect blocks at ground level
```

### Use Case 4: Granting Access to Team
```
# Admin grants access to entire dev team
/dbaccess grant developer1
/dbaccess grant developer2
/dbaccess grant designer1

# Check who has access
/dbaccess list
```

## 🛠️ Technical Details

### Permission System
- Uses both UUID and username for flexibility
- Persists across server restarts
- Stored in YAML format
- Can be edited manually

### Teleportation
- Works on Fabric servers (standard /tp might not)
- Custom implementation in plugin
- Respects world boundaries
- Safe teleportation (won't place in walls)

### Security
- OPs can do everything
- Admins can grant access but not create admins
- Users can only view (read-only)
- No risk of accidental data modification

## 🐛 Troubleshooting

### "You don't have permission"
**Solution:** Ask an admin to run:
```
/dbaccess grant YourUsername
```

### "Failed to teleport"
**Check:**
1. Is the world loaded?
2. Are the chunks loaded?
3. Try `/dbview all` first

### Teleport doesn't work
**This system replaces standard /tp** which may not work on Fabric. Use:
```
/dbteleport reels
```
Instead of:
```
/tp @s 0 50 0
```

### Not switching to spectator mode
Use `/dbview` instead of `/dbteleport`. The `dbview` command auto-switches to spectator.

## 📖 Examples

### Scenario: New Developer Joins

**Admin:**
```
/dbadmin add newdev
/dbaccess grant newdev
```

**New Developer:**
```
/dbview all              # Get overview
/dbview reels            # Focus on reels
/dbview lectures         # Focus on lectures
/dbteleport notes 0 0    # Check specific location
/gamemode creative       # Return to building
```

### Scenario: Team Presentation

```
# Everyone gets access for demo
/dbaccess grant teammate1
/dbaccess grant teammate2
/dbaccess grant teammate3

# Lead presenter
/dbview all

# Explain system while flying through regions
```

### Scenario: Removing Access

```
# User no longer needs access
/dbaccess revoke olduser

# Verify
/dbaccess list
```

## ✅ Benefits

1. **No Fabric TP Issues** - Custom teleport works everywhere
2. **Permission Control** - Granular access management
3. **Safe Viewing** - Spectator mode prevents accidents
4. **Easy to Use** - Simple commands
5. **Persistent** - Survives restarts
6. **Flexible** - UUID or username
7. **Documented** - Full audit trail in YAML

## 🎉 Summary

**You now have a complete database access system!**

- ✅ Custom commands that work on Fabric
- ✅ Permission management
- ✅ Safe spectator viewing
- ✅ Flexible teleportation
- ✅ Easy admin tools
- ✅ Persistent storage

**No more worrying about /tp not working!** 🎮

---

**Try it out:**
```
/dbadmin add YourUsername
/dbaccess grant Friend
/dbview all
```

