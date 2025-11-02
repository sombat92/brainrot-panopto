package com.brainrot.mcdb.utils;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Permission Manager for Minecraft Database
 * Handles admin permissions and database access
 */
public class PermissionManager {
    private final File permissionsFile;
    private FileConfiguration permissionsConfig;
    private List<String> admins;
    private List<String> databaseAccess;
    
    public PermissionManager(File dataFolder) {
        this.permissionsFile = new File(dataFolder, "permissions.yml");
        loadPermissions();
    }
    
    /**
     * Load permissions from file
     */
    private void loadPermissions() {
        if (!permissionsFile.exists()) {
            permissionsFile.getParentFile().mkdirs();
            try {
                permissionsFile.createNewFile();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        
        permissionsConfig = YamlConfiguration.loadConfiguration(permissionsFile);
        
        // Load admin list
        admins = permissionsConfig.getStringList("admins");
        if (admins == null) {
            admins = new ArrayList<>();
        }
        
        // Load database access list
        databaseAccess = permissionsConfig.getStringList("database-access");
        if (databaseAccess == null) {
            databaseAccess = new ArrayList<>();
        }
        
        // Set defaults if empty
        if (admins.isEmpty() && databaseAccess.isEmpty()) {
            permissionsConfig.set("admins", new ArrayList<String>());
            permissionsConfig.set("database-access", new ArrayList<String>());
            permissionsConfig.set("info", "Add player UUIDs or names to grant permissions");
            savePermissions();
        }
    }
    
    /**
     * Save permissions to file
     */
    private void savePermissions() {
        try {
            permissionsConfig.save(permissionsFile);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Check if player is admin
     */
    public boolean isAdmin(Player player) {
        return admins.contains(player.getUniqueId().toString()) || 
               admins.contains(player.getName()) ||
               player.isOp();
    }
    
    /**
     * Check if player has database access
     */
    public boolean hasDatabaseAccess(Player player) {
        return isAdmin(player) || 
               databaseAccess.contains(player.getUniqueId().toString()) ||
               databaseAccess.contains(player.getName());
    }
    
    /**
     * Add admin
     */
    public void addAdmin(String identifier) {
        if (!admins.contains(identifier)) {
            admins.add(identifier);
            permissionsConfig.set("admins", admins);
            savePermissions();
        }
    }
    
    /**
     * Remove admin
     */
    public void removeAdmin(String identifier) {
        admins.remove(identifier);
        permissionsConfig.set("admins", admins);
        savePermissions();
    }
    
    /**
     * Grant database access
     */
    public void grantDatabaseAccess(String identifier) {
        if (!databaseAccess.contains(identifier)) {
            databaseAccess.add(identifier);
            permissionsConfig.set("database-access", databaseAccess);
            savePermissions();
        }
    }
    
    /**
     * Revoke database access
     */
    public void revokeDatabaseAccess(String identifier) {
        databaseAccess.remove(identifier);
        permissionsConfig.set("database-access", databaseAccess);
        savePermissions();
    }
    
    /**
     * Get all admins
     */
    public List<String> getAdmins() {
        return new ArrayList<>(admins);
    }
    
    /**
     * Get all users with database access
     */
    public List<String> getDatabaseAccessList() {
        return new ArrayList<>(databaseAccess);
    }
}

