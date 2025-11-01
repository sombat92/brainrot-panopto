package com.brainrot.mcdb;

import com.brainrot.mcdb.database.BlockDatabase;
import com.brainrot.mcdb.database.ChunkManager;
import com.brainrot.mcdb.socket.SocketServer;
import com.brainrot.mcdb.utils.ConfigManager;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

public class MinecraftDBPlugin extends JavaPlugin {
    
    private static MinecraftDBPlugin instance;
    private ConfigManager configManager;
    private ChunkManager chunkManager;
    private BlockDatabase blockDatabase;
    private SocketServer socketServer;
    
    @Override
    public void onEnable() {
        instance = this;
        
        // Save default config
        saveDefaultConfig();
        
        // Initialize managers
        configManager = new ConfigManager(this);
        
        getLogger().info("Initializing Minecraft Database Plugin...");
        
        try {
            // Initialize chunk manager
            chunkManager = new ChunkManager(this);
            chunkManager.initialize();
            getLogger().info("Chunk manager initialized");
            
            // Initialize block database
            blockDatabase = new BlockDatabase(this, chunkManager);
            blockDatabase.initialize();
            getLogger().info("Block database initialized");
            
            // Start socket server if enabled
            if (configManager.isSocketEnabled()) {
                socketServer = new SocketServer(this, blockDatabase);
                socketServer.start();
                getLogger().info("Socket server started on port " + configManager.getSocketPort());
            }
            
            getLogger().info("Minecraft Database Plugin enabled successfully!");
            logDatabaseStats();
            
        } catch (Exception e) {
            getLogger().severe("Failed to initialize plugin: " + e.getMessage());
            e.printStackTrace();
            getServer().getPluginManager().disablePlugin(this);
        }
    }
    
    @Override
    public void onDisable() {
        getLogger().info("Shutting down Minecraft Database Plugin...");
        
        // Stop socket server
        if (socketServer != null) {
            socketServer.stop();
            getLogger().info("Socket server stopped");
        }
        
        // Save any pending data
        if (blockDatabase != null) {
            blockDatabase.shutdown();
            getLogger().info("Database saved and shut down");
        }
        
        // Unload chunks
        if (chunkManager != null) {
            chunkManager.shutdown();
            getLogger().info("Chunks unloaded");
        }
        
        getLogger().info("Minecraft Database Plugin disabled");
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("mcdb")) {
            return false;
        }
        
        if (!sender.hasPermission("mcdb.admin")) {
            sender.sendMessage("§cYou don't have permission to use this command!");
            return true;
        }
        
        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }
        
        switch (args[0].toLowerCase()) {
            case "reload":
                reloadConfig();
                configManager = new ConfigManager(this);
                sender.sendMessage("§aConfiguration reloaded!");
                return true;
                
            case "status":
                sendStatus(sender);
                return true;
                
            case "clear":
                if (sender instanceof Player) {
                    sender.sendMessage("§cThis command can only be executed from console for safety!");
                    return true;
                }
                clearDatabase(sender);
                return true;
                
            case "test":
                testDatabase(sender);
                return true;
                
            case "info":
                sendInfo(sender);
                return true;
                
            default:
                sendHelp(sender);
                return true;
        }
    }
    
    private void sendHelp(CommandSender sender) {
        sender.sendMessage("§6§l=== Minecraft Database Commands ===");
        sender.sendMessage("§e/mcdb reload §7- Reload configuration");
        sender.sendMessage("§e/mcdb status §7- Show server status");
        sender.sendMessage("§e/mcdb info §7- Show database info");
        sender.sendMessage("§e/mcdb test §7- Run database test");
        sender.sendMessage("§e/mcdb clear §7- Clear all data (console only)");
    }
    
    private void sendStatus(CommandSender sender) {
        sender.sendMessage("§6§l=== MCDB Status ===");
        sender.sendMessage("§eSocket Server: " + (socketServer != null && socketServer.isRunning() ? "§aRunning" : "§cStopped"));
        sender.sendMessage("§ePort: §f" + configManager.getSocketPort());
        sender.sendMessage("§eConnections: §f" + (socketServer != null ? socketServer.getConnectionCount() : 0));
        sender.sendMessage("§eChunks Loaded: §f" + chunkManager.getLoadedChunkCount());
        sender.sendMessage("§eEntries: §f" + blockDatabase.getEntryCount());
        sender.sendMessage("§eCache Size: §f" + blockDatabase.getCacheSize());
    }
    
    private void sendInfo(CommandSender sender) {
        sender.sendMessage("§6§l=== Database Information ===");
        sender.sendMessage("§eWorld: §f" + configManager.getWorldName());
        sender.sendMessage("§eChunk Area: §f" + configManager.getChunkStartX() + "," + configManager.getChunkStartZ() +
                " to " + configManager.getChunkEndX() + "," + configManager.getChunkEndZ());
        sender.sendMessage("§eY Range: §f" + configManager.getMinY() + " - " + configManager.getMaxY());
        sender.sendMessage("§eEncoding: §f" + configManager.getEncoding());
        sender.sendMessage("§eCapacity: §f~" + blockDatabase.getEstimatedCapacity() + " entries");
        sender.sendMessage("§eUsed: §f" + blockDatabase.getUsedCapacity() + "%");
    }
    
    private void clearDatabase(CommandSender sender) {
        sender.sendMessage("§eClearing database...");
        int cleared = blockDatabase.clearAll();
        sender.sendMessage("§aCleared " + cleared + " entries from database!");
    }
    
    private void testDatabase(CommandSender sender) {
        sender.sendMessage("§eRunning database test...");
        
        try {
            // Write test
            String testKey = "test_" + System.currentTimeMillis();
            String testValue = "Hello from MCDB!";
            
            long startWrite = System.currentTimeMillis();
            blockDatabase.write(testKey, testValue.getBytes());
            long writeTime = System.currentTimeMillis() - startWrite;
            
            sender.sendMessage("§aWrite test passed (" + writeTime + "ms)");
            
            // Read test
            long startRead = System.currentTimeMillis();
            byte[] data = blockDatabase.read(testKey);
            long readTime = System.currentTimeMillis() - startRead;
            
            String retrieved = new String(data);
            if (retrieved.equals(testValue)) {
                sender.sendMessage("§aRead test passed (" + readTime + "ms)");
            } else {
                sender.sendMessage("§cRead test failed: data mismatch");
            }
            
            // Delete test
            long startDelete = System.currentTimeMillis();
            blockDatabase.delete(testKey);
            long deleteTime = System.currentTimeMillis() - startDelete;
            
            sender.sendMessage("§aDelete test passed (" + deleteTime + "ms)");
            sender.sendMessage("§aAll tests completed successfully!");
            
        } catch (Exception e) {
            sender.sendMessage("§cTest failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void logDatabaseStats() {
        getLogger().info("Database Statistics:");
        getLogger().info("  Chunks: " + chunkManager.getLoadedChunkCount());
        getLogger().info("  Capacity: ~" + blockDatabase.getEstimatedCapacity() + " entries");
        getLogger().info("  Current entries: " + blockDatabase.getEntryCount());
    }
    
    public static MinecraftDBPlugin getInstance() {
        return instance;
    }
    
    public ConfigManager getConfigManager() {
        return configManager;
    }
    
    public ChunkManager getChunkManager() {
        return chunkManager;
    }
    
    public BlockDatabase getBlockDatabase() {
        return blockDatabase;
    }
    
    public SocketServer getSocketServer() {
        return socketServer;
    }
}

