package com.brainrot.mcdb.utils;

import com.brainrot.mcdb.MinecraftDBPlugin;
import org.bukkit.configuration.file.FileConfiguration;

public class ConfigManager {
    
    private final MinecraftDBPlugin plugin;
    private final FileConfiguration config;
    
    public ConfigManager(MinecraftDBPlugin plugin) {
        this.plugin = plugin;
        this.config = plugin.getConfig();
    }
    
    // Socket configuration
    public boolean isSocketEnabled() {
        return config.getBoolean("socket.enabled", true);
    }
    
    public String getSocketHost() {
        return config.getString("socket.host", "0.0.0.0");
    }
    
    public int getSocketPort() {
        return config.getInt("socket.port", 25566);
    }
    
    public String getAuthToken() {
        return config.getString("socket.auth-token", "change-me-in-production-please");
    }
    
    public int getMaxConnections() {
        return config.getInt("socket.max-connections", 10);
    }
    
    public int getTimeoutSeconds() {
        return config.getInt("socket.timeout-seconds", 30);
    }
    
    // Database configuration
    public String getWorldName() {
        return config.getString("database.world", "world");
    }
    
    public int getChunkStartX() {
        return config.getInt("database.chunks.start-x", 0);
    }
    
    public int getChunkStartZ() {
        return config.getInt("database.chunks.start-z", 0);
    }
    
    public int getChunkEndX() {
        return config.getInt("database.chunks.end-x", 3);
    }
    
    public int getChunkEndZ() {
        return config.getInt("database.chunks.end-z", 3);
    }
    
    public int getMinY() {
        return config.getInt("database.storage.min-y", 5);
    }
    
    public int getMaxY() {
        return config.getInt("database.storage.max-y", 250);
    }
    
    public String getEncoding() {
        return config.getString("database.storage.encoding", "simple");
    }
    
    public int getBlocksPerKey() {
        return config.getInt("database.storage.blocks-per-key", 16);
    }
    
    public int getBlocksPerValue() {
        return config.getInt("database.storage.blocks-per-value", 32);
    }
    
    public boolean isCompressionEnabled() {
        return config.getBoolean("database.storage.compression", true);
    }
    
    // Protection configuration
    public boolean preventPlayerAccess() {
        return config.getBoolean("database.protection.prevent-player-access", true);
    }
    
    public boolean preventExplosions() {
        return config.getBoolean("database.protection.prevent-explosions", true);
    }
    
    public boolean preventBlockUpdates() {
        return config.getBoolean("database.protection.prevent-block-updates", true);
    }
    
    public boolean preventMobSpawning() {
        return config.getBoolean("database.protection.prevent-mob-spawning", true);
    }
    
    public int getTeleportDistance() {
        return config.getInt("database.protection.teleport-distance", 100);
    }
    
    // Logging configuration
    public String getLogLevel() {
        return config.getString("logging.level", "INFO");
    }
    
    public boolean logOperations() {
        return config.getBoolean("logging.log-operations", true);
    }
    
    public boolean logSocketConnections() {
        return config.getBoolean("logging.log-socket-connections", true);
    }
    
    public boolean logPerformance() {
        return config.getBoolean("logging.log-performance", false);
    }
    
    // Performance configuration
    public boolean useAsyncOperations() {
        return config.getBoolean("performance.async-operations", true);
    }
    
    public boolean useBatchWrites() {
        return config.getBoolean("performance.batch-writes", true);
    }
    
    public int getCacheSize() {
        return config.getInt("performance.cache-size", 1000);
    }
    
    public int getCacheTTLSeconds() {
        return config.getInt("performance.cache-ttl-seconds", 300);
    }
    
    public int getAutoSaveInterval() {
        return config.getInt("performance.auto-save-interval", 6000);
    }
    
    // Maintenance configuration
    public int getAutoCleanupDays() {
        return config.getInt("maintenance.auto-cleanup-days", 0);
    }
    
    public boolean defragmentOnStartup() {
        return config.getBoolean("maintenance.defragment-on-startup", false);
    }
}

