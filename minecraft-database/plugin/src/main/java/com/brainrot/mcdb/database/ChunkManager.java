package com.brainrot.mcdb.database;

import com.brainrot.mcdb.MinecraftDBPlugin;
import com.brainrot.mcdb.models.BlockPosition;
import com.brainrot.mcdb.utils.ConfigManager;
import org.bukkit.Chunk;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityExplodeEvent;
import org.bukkit.event.player.PlayerMoveEvent;

import java.util.ArrayList;
import java.util.List;

public class ChunkManager implements Listener {
    
    private final MinecraftDBPlugin plugin;
    private final ConfigManager config;
    private World world;
    private final List<Chunk> databaseChunks;
    
    public ChunkManager(MinecraftDBPlugin plugin) {
        this.plugin = plugin;
        this.config = plugin.getConfigManager();
        this.databaseChunks = new ArrayList<>();
    }
    
    public void initialize() {
        // Get world
        world = plugin.getServer().getWorld(config.getWorldName());
        if (world == null) {
            throw new RuntimeException("World '" + config.getWorldName() + "' not found!");
        }
        
        // Load and force-load database chunks
        int startX = config.getChunkStartX();
        int startZ = config.getChunkStartZ();
        int endX = config.getChunkEndX();
        int endZ = config.getChunkEndZ();
        
        plugin.getLogger().info("Loading chunks from (" + startX + "," + startZ + ") to (" + endX + "," + endZ + ")");
        
        for (int x = startX; x <= endX; x++) {
            for (int z = startZ; z <= endZ; z++) {
                Chunk chunk = world.getChunkAt(x, z);
                chunk.load(true);
                chunk.setForceLoaded(true);
                databaseChunks.add(chunk);
            }
        }
        
        plugin.getLogger().info("Loaded " + databaseChunks.size() + " database chunks");
        
        // Register protection events
        plugin.getServer().getPluginManager().registerEvents(this, plugin);
    }
    
    public void shutdown() {
        // Unload chunks (but keep them force-loaded for next startup)
        for (Chunk chunk : databaseChunks) {
            chunk.setForceLoaded(true); // Keep force-loaded
        }
        databaseChunks.clear();
        
        plugin.getLogger().info("Database chunks shut down (kept force-loaded)");
    }
    
    public World getWorld() {
        return world;
    }
    
    public List<Chunk> getDatabaseChunks() {
        return new ArrayList<>(databaseChunks);
    }
    
    public int getLoadedChunkCount() {
        return databaseChunks.size();
    }
    
    public boolean isInDatabaseArea(Location location) {
        if (location.getWorld() != world) {
            return false;
        }
        
        int chunkX = location.getBlockX() >> 4;
        int chunkZ = location.getBlockZ() >> 4;
        
        return chunkX >= config.getChunkStartX() && chunkX <= config.getChunkEndX() &&
               chunkZ >= config.getChunkStartZ() && chunkZ <= config.getChunkEndZ() &&
               location.getBlockY() >= config.getMinY() && location.getBlockY() <= config.getMaxY();
    }
    
    public boolean isInDatabaseArea(BlockPosition position) {
        int chunkX = position.getX() >> 4;
        int chunkZ = position.getZ() >> 4;
        
        return chunkX >= config.getChunkStartX() && chunkX <= config.getChunkEndX() &&
               chunkZ >= config.getChunkStartZ() && chunkZ <= config.getChunkEndZ() &&
               position.getY() >= config.getMinY() && position.getY() <= config.getMaxY();
    }
    
    public BlockPosition getStartPosition() {
        int startX = config.getChunkStartX() * 16;
        int startZ = config.getChunkStartZ() * 16;
        int startY = config.getMinY();
        return new BlockPosition(startX, startY, startZ);
    }
    
    public BlockPosition getEndPosition() {
        int endX = (config.getChunkEndX() + 1) * 16 - 1;
        int endZ = (config.getChunkEndZ() + 1) * 16 - 1;
        int endY = config.getMaxY();
        return new BlockPosition(endX, endY, endZ);
    }
    
    public int getTotalBlocks() {
        BlockPosition start = getStartPosition();
        BlockPosition end = getEndPosition();
        
        int width = end.getX() - start.getX() + 1;
        int height = end.getY() - start.getY() + 1;
        int depth = end.getZ() - start.getZ() + 1;
        
        return width * height * depth;
    }
    
    // Protection Events
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onBlockBreak(BlockBreakEvent event) {
        if (!config.preventPlayerAccess()) return;
        
        Player player = event.getPlayer();
        if (player.hasPermission("mcdb.bypass")) return;
        
        if (isInDatabaseArea(event.getBlock().getLocation())) {
            event.setCancelled(true);
            player.sendMessage("§cYou cannot break blocks in the database area!");
        }
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onBlockPlace(BlockPlaceEvent event) {
        if (!config.preventPlayerAccess()) return;
        
        Player player = event.getPlayer();
        if (player.hasPermission("mcdb.bypass")) return;
        
        if (isInDatabaseArea(event.getBlock().getLocation())) {
            event.setCancelled(true);
            player.sendMessage("§cYou cannot place blocks in the database area!");
        }
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onExplode(EntityExplodeEvent event) {
        if (!config.preventExplosions()) return;
        
        event.blockList().removeIf(block -> isInDatabaseArea(block.getLocation()));
    }
    
    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerMove(PlayerMoveEvent event) {
        if (!config.preventPlayerAccess()) return;
        if (event.getTo() == null) return;
        
        Player player = event.getPlayer();
        if (player.hasPermission("mcdb.bypass")) return;
        
        Location from = event.getFrom();
        Location to = event.getTo();
        
        // Check if player is entering database area
        if (!isInDatabaseArea(from) && isInDatabaseArea(to)) {
            // Teleport player away
            int distance = config.getTeleportDistance();
            Location newLoc = from.clone().add(from.getDirection().multiply(-distance));
            newLoc.setY(world.getHighestBlockYAt(newLoc) + 1);
            
            player.teleport(newLoc);
            player.sendMessage("§cYou cannot enter the database area!");
        }
    }
}

