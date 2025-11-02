# ⚡ Quick Command Reference

## 🚀 First Time Setup

### Deploy Plugin to Your Server

```bash
cd /Users/michael/Documents/Home/brainrot-panopto

# Auto-deploy (finds server automatically)
./admin/deploy-plugin.sh

# Or setup new server from scratch
./admin/minecraft-setup.sh
```

---

## 🎮 Essential In-Game Commands

### Initial Setup (Run once as OP)

```bash
/op YourUsername                    # Make yourself OP
/dbadmin add YourUsername           # Make yourself admin
/dbaccess grant YourUsername        # Grant yourself access
```

### Grant Access to Others

```bash
/dbaccess grant PlayerName          # Give player database access
/dbadmin add PlayerName             # Make player an admin
```

### View Database Regions

```bash
/dbview all                         # View entire database (spectator mode)
/dbview reels                       # View reels region (Y: 5-100)
/dbview lectures                    # View lectures region (Y: 105-200)
/dbview notes                       # View notes region (Y: 201-250)
```

### Teleport to Database

```bash
/dbteleport reels                   # TP to reels (stays in current gamemode)
/dbtp lectures                      # Alias: TP to lectures
/dbt notes 100 200                  # TP to notes at X=100, Z=200
```

### Check Permissions

```bash
/dbadmin list                       # Show all admins
/dbaccess list                      # Show all users with access
```

### Remove Access

```bash
/dbaccess revoke PlayerName         # Remove database access
/dbadmin remove PlayerName          # Remove admin status
```

---

## 🗂️ Database Regions

| Region   | Y-Levels | View Command    | Teleport Command      |
|----------|----------|-----------------|-----------------------|
| Reels    | 5-100    | `/dbview reels` | `/dbteleport reels`   |
| Lectures | 105-200  | `/dbview lectures` | `/dbteleport lectures` |
| Notes    | 201-250  | `/dbview notes` | `/dbteleport notes`   |
| All      | 5-250    | `/dbview all`   | `/dbteleport all`     |

---

## 📜 Common Workflows

### New Player Joins

```bash
# As admin/OP:
/dbaccess grant NewPlayer

# New player can now:
/dbview all
```

### Team Presentation

```bash
# Grant access to team:
/dbaccess grant teammate1
/dbaccess grant teammate2
/dbaccess grant teammate3

# Everyone can explore:
/dbview all
```

### Debugging Data

```bash
# View specific region:
/dbview reels

# Teleport to precise location:
/dbteleport reels 0 0

# Switch gamemode if needed:
/gamemode creative
```

---

## 🔧 Troubleshooting

### Can't Find Server?

The script searches:
- `~/minecraft-server`
- `~/minecraft`
- `~/Documents/minecraft`
- `~/Desktop/minecraft`

**Fix:** Move your server or create symlink:
```bash
ln -s /path/to/your/server ~/minecraft-server
```

### Permission Denied?

Make sure you have access:
```bash
/op YourUsername
/dbadmin add YourUsername
/dbaccess grant YourUsername
```

### Teleport Not Working?

Use **custom commands** (work on all servers including Fabric):
```bash
/dbteleport reels    # ✅ Works everywhere
/tp 0 50 0           # ❌ Might not work on Fabric
```

### Plugin Not Loading?

Rebuild and redeploy:
```bash
cd /Users/michael/Documents/Home/brainrot-panopto/minecraft-database/plugin
mvn clean package
cd ../..
./admin/deploy-plugin.sh
# Restart server
```

---

## 🎯 Quick Reference Card

**Admin Commands:**
- `/dbadmin add/remove/list <player>` - Manage admins
- `/dbaccess grant/revoke/list <player>` - Manage access

**User Commands:**
- `/dbview <region>` - View in spectator mode
- `/dbteleport <region> [x] [z]` - Teleport (aliases: `/dbtp`, `/dbt`)

**Regions:**
- `reels` (Y: 5-100)
- `lectures` (Y: 105-200)
- `notes` (Y: 201-250)
- `all` (overview)

---

## 📚 More Info

- **[DATABASE_ACCESS.md](DATABASE_ACCESS.md)** - Complete guide with examples
- **[admin/README.md](../admin/README.md)** - All admin scripts
- **[README.md](README.md)** - System architecture

---

## 💡 Pro Tips

1. **Use aliases:** `/dbtp` is faster than `/dbteleport`
2. **Spectator mode:** Use `/dbview` to explore without modifying
3. **Precise coords:** Add X/Z to `/dbteleport` for exact locations
4. **Auto-sync:** Reels from R2 automatically sync to Minecraft
5. **Permissions persist:** No need to re-grant after restart

---

## 🎉 You're Ready!

```bash
# Terminal
./admin/deploy-plugin.sh

# In Minecraft
/dbadmin add YourUsername
/dbview all

# Enjoy! 🎮
```

