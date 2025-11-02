package com.brainrot.mcdb.commands;

import com.brainrot.mcdb.MinecraftDBPlugin;
import com.brainrot.mcdb.utils.PermissionManager;
import org.bukkit.ChatColor;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Database access and admin commands
 */
public class DatabaseCommands implements CommandExecutor, TabCompleter {
    private final MinecraftDBPlugin plugin;
    private final PermissionManager permissionManager;
    
    // Database regions
    private static final int REELS_Y_MIN = 5;
    private static final int REELS_Y_MAX = 100;
    private static final int LECTURES_Y_MIN = 105;
    private static final int LECTURES_Y_MAX = 200;
    private static final int NOTES_Y_MIN = 201;
    private static final int NOTES_Y_MAX = 250;
    
    public DatabaseCommands(MinecraftDBPlugin plugin, PermissionManager permissionManager) {
        this.plugin = plugin;
        this.permissionManager = permissionManager;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED + "This command can only be used by players!");
            return true;
        }
        
        Player player = (Player) sender;
        
        switch (command.getName().toLowerCase()) {
            case "dbaccess":
                return handleDatabaseAccess(player, args);
            case "dbadmin":
                return handleDatabaseAdmin(player, args);
            case "dbview":
                return handleDatabaseView(player, args);
            case "dbteleport":
                return handleDatabaseTeleport(player, args);
            default:
                return false;
        }
    }
    
    /**
     * Handle database access command
     */
    private boolean handleDatabaseAccess(Player player, String[] args) {
        if (!permissionManager.isAdmin(player)) {
            player.sendMessage(ChatColor.RED + "You don't have permission to use this command!");
            return true;
        }
        
        if (args.length < 2) {
            player.sendMessage(ChatColor.YELLOW + "Usage: /dbaccess <grant|revoke|list> <player>");
            return true;
        }
        
        String action = args[0].toLowerCase();
        
        switch (action) {
            case "grant":
                permissionManager.grantDatabaseAccess(args[1]);
                player.sendMessage(ChatColor.GREEN + "✓ Granted database access to " + args[1]);
                break;
                
            case "revoke":
                permissionManager.revokeDatabaseAccess(args[1]);
                player.sendMessage(ChatColor.GREEN + "✓ Revoked database access from " + args[1]);
                break;
                
            case "list":
                List<String> accessList = permissionManager.getDatabaseAccessList();
                player.sendMessage(ChatColor.GOLD + "=== Database Access List ===");
                if (accessList.isEmpty()) {
                    player.sendMessage(ChatColor.GRAY + "No users have database access");
                } else {
                    accessList.forEach(user -> player.sendMessage(ChatColor.WHITE + "- " + user));
                }
                break;
                
            default:
                player.sendMessage(ChatColor.RED + "Unknown action: " + action);
                return false;
        }
        
        return true;
    }
    
    /**
     * Handle admin management command
     */
    private boolean handleDatabaseAdmin(Player player, String[] args) {
        if (!player.isOp()) {
            player.sendMessage(ChatColor.RED + "Only server operators can use this command!");
            return true;
        }
        
        if (args.length < 2) {
            player.sendMessage(ChatColor.YELLOW + "Usage: /dbadmin <add|remove|list> <player>");
            return true;
        }
        
        String action = args[0].toLowerCase();
        
        switch (action) {
            case "add":
                permissionManager.addAdmin(args[1]);
                player.sendMessage(ChatColor.GREEN + "✓ Added " + args[1] + " as admin");
                break;
                
            case "remove":
                permissionManager.removeAdmin(args[1]);
                player.sendMessage(ChatColor.GREEN + "✓ Removed " + args[1] + " from admins");
                break;
                
            case "list":
                List<String> adminList = permissionManager.getAdmins();
                player.sendMessage(ChatColor.GOLD + "=== Admin List ===");
                if (adminList.isEmpty()) {
                    player.sendMessage(ChatColor.GRAY + "No admins configured");
                } else {
                    adminList.forEach(admin -> player.sendMessage(ChatColor.WHITE + "- " + admin));
                }
                break;
                
            default:
                player.sendMessage(ChatColor.RED + "Unknown action: " + action);
                return false;
        }
        
        return true;
    }
    
    /**
     * Handle database view command (enters spectator mode in database)
     */
    private boolean handleDatabaseView(Player player, String[] args) {
        if (!permissionManager.hasDatabaseAccess(player)) {
            player.sendMessage(ChatColor.RED + "You don't have permission to view the database!");
            player.sendMessage(ChatColor.GRAY + "Ask an admin to grant you access with /dbaccess grant <your name>");
            return true;
        }
        
        if (args.length < 1) {
            player.sendMessage(ChatColor.YELLOW + "Usage: /dbview <reels|lectures|notes|all>");
            return true;
        }
        
        String region = args[0].toLowerCase();
        int targetY;
        String regionName;
        
        switch (region) {
            case "reels":
                targetY = (REELS_Y_MIN + REELS_Y_MAX) / 2;
                regionName = "Reels Database (Y: 5-100)";
                break;
                
            case "lectures":
                targetY = (LECTURES_Y_MIN + LECTURES_Y_MAX) / 2;
                regionName = "Lectures Database (Y: 105-200)";
                break;
                
            case "notes":
                targetY = (NOTES_Y_MIN + NOTES_Y_MAX) / 2;
                regionName = "Notes Database (Y: 201-250)";
                break;
                
            case "all":
                targetY = 125; // Middle of all regions
                regionName = "All Database Regions";
                break;
                
            default:
                player.sendMessage(ChatColor.RED + "Unknown region: " + region);
                player.sendMessage(ChatColor.YELLOW + "Available regions: reels, lectures, notes, all");
                return true;
        }
        
        // Teleport to database region
        Location dbLocation = new Location(player.getWorld(), 0, targetY, 0);
        player.teleport(dbLocation);
        
        // Set spectator mode
        player.setGameMode(GameMode.SPECTATOR);
        
        player.sendMessage(ChatColor.GREEN + "✓ Entering " + regionName);
        player.sendMessage(ChatColor.GRAY + "You are now in spectator mode");
        player.sendMessage(ChatColor.GRAY + "Use /gamemode creative to exit viewing mode");
        
        return true;
    }
    
    /**
     * Handle database teleport command (without changing gamemode)
     */
    private boolean handleDatabaseTeleport(Player player, String[] args) {
        if (!permissionManager.hasDatabaseAccess(player)) {
            player.sendMessage(ChatColor.RED + "You don't have permission to access the database!");
            return true;
        }
        
        if (args.length < 1) {
            player.sendMessage(ChatColor.YELLOW + "Usage: /dbteleport <reels|lectures|notes|all> [x] [z]");
            return true;
        }
        
        String region = args[0].toLowerCase();
        int targetY;
        String regionName;
        
        switch (region) {
            case "reels":
                targetY = (REELS_Y_MIN + REELS_Y_MAX) / 2;
                regionName = "Reels Region";
                break;
                
            case "lectures":
                targetY = (LECTURES_Y_MIN + LECTURES_Y_MAX) / 2;
                regionName = "Lectures Region";
                break;
                
            case "notes":
                targetY = (NOTES_Y_MIN + NOTES_Y_MAX) / 2;
                regionName = "Notes Region";
                break;
                
            case "all":
                targetY = 125;
                regionName = "Database Center";
                break;
                
            default:
                player.sendMessage(ChatColor.RED + "Unknown region: " + region);
                return true;
        }
        
        // Parse coordinates if provided
        double x = 0;
        double z = 0;
        
        if (args.length >= 3) {
            try {
                x = Double.parseDouble(args[1]);
                z = Double.parseDouble(args[2]);
            } catch (NumberFormatException e) {
                player.sendMessage(ChatColor.RED + "Invalid coordinates!");
                return true;
            }
        }
        
        Location dbLocation = new Location(player.getWorld(), x, targetY, z);
        player.teleport(dbLocation);
        
        player.sendMessage(ChatColor.GREEN + "✓ Teleported to " + regionName);
        player.sendMessage(ChatColor.GRAY + "Coordinates: " + (int)x + ", " + targetY + ", " + (int)z);
        
        return true;
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        List<String> completions = new ArrayList<>();
        
        if (!(sender instanceof Player)) {
            return completions;
        }
        
        Player player = (Player) sender;
        
        switch (command.getName().toLowerCase()) {
            case "dbaccess":
                if (args.length == 1) {
                    completions.addAll(Arrays.asList("grant", "revoke", "list"));
                }
                break;
                
            case "dbadmin":
                if (args.length == 1) {
                    completions.addAll(Arrays.asList("add", "remove", "list"));
                }
                break;
                
            case "dbview":
            case "dbteleport":
                if (args.length == 1) {
                    completions.addAll(Arrays.asList("reels", "lectures", "notes", "all"));
                }
                break;
        }
        
        return completions;
    }
}

