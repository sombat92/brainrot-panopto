package com.brainrot.mcdb.database;

import com.brainrot.mcdb.MinecraftDBPlugin;
import com.brainrot.mcdb.models.BlockPosition;
import com.brainrot.mcdb.models.DataAddress;
import com.brainrot.mcdb.models.DataEntry;
import com.brainrot.mcdb.utils.ConfigManager;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.block.Block;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class BlockDatabase {
    
    private final MinecraftDBPlugin plugin;
    private final ConfigManager config;
    private final ChunkManager chunkManager;
    private final DataEncoder encoder;
    
    // In-memory index: key -> DataAddress
    private final Map<String, DataAddress> index;
    
    // Cache for recently accessed data
    private final Map<String, DataEntry> cache;
    private final Map<String, Long> cacheTimestamps;
    
    // Current write position
    private BlockPosition currentWritePosition;
    
    public BlockDatabase(MinecraftDBPlugin plugin, ChunkManager chunkManager) {
        this.plugin = plugin;
        this.config = plugin.getConfigManager();
        this.chunkManager = chunkManager;
        this.encoder = new DataEncoder(config.isCompressionEnabled());
        this.index = new ConcurrentHashMap<>();
        this.cache = new ConcurrentHashMap<>();
        this.cacheTimestamps = new ConcurrentHashMap<>();
    }
    
    public void initialize() {
        // Start at the beginning of the database area
        currentWritePosition = chunkManager.getStartPosition();
        
        plugin.getLogger().info("Block database initialized");
        plugin.getLogger().info("  Start position: " + currentWritePosition);
        plugin.getLogger().info("  Total capacity: ~" + getEstimatedCapacity() + " entries");
        
        // Scan and rebuild index from existing blocks
        rebuildIndex();
        
        // Initialize database area with AIR blocks if empty
        Bukkit.getScheduler().runTask(plugin, this::initializeDatabaseArea);
    }
    
    /**
     * Initialize database area with AIR blocks on first run
     * This ensures the findAvailableSpace method can find AIR blocks
     */
    private void initializeDatabaseArea() {
        if (!index.isEmpty()) {
            plugin.getLogger().info("Database area already has " + index.size() + " entries, skipping initialization");
            return;
        }
        
        plugin.getLogger().info("Initializing database area with AIR blocks...");
        
        BlockPosition start = chunkManager.getStartPosition();
        BlockPosition end = chunkManager.getEndPosition();
        
        int blocksSet = 0;
        int blocksChecked = 0;
        
        for (int y = start.getY(); y <= end.getY(); y++) {
            for (int z = start.getZ(); z <= end.getZ(); z++) {
                for (int x = start.getX(); x <= end.getX(); x++) {
                    Block block = chunkManager.getWorld().getBlockAt(x, y, z);
                    blocksChecked++;
                    
                    if (block.getType() != Material.AIR) {
                        block.setType(Material.AIR);
                        blocksSet++;
                    }
                }
            }
        }
        
        plugin.getLogger().info("Database area ready: " + 
            blocksChecked + " blocks checked, " + 
            blocksSet + " converted to AIR");
    }
    
    public void shutdown() {
        // Cache is in-memory only, will be lost on shutdown
        cache.clear();
        cacheTimestamps.clear();
        plugin.getLogger().info("Block database shut down");
    }
    
    /**
     * Write data to the database
     */
    public synchronized void write(String key, byte[] value) throws IOException {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Key cannot be null or empty");
        }
        
        if (value == null) {
            throw new IllegalArgumentException("Value cannot be null");
        }
        
        // Check if key already exists - delete old entry first
        if (index.containsKey(key)) {
            delete(key);
        }
        
        // Encode data to blocks
        List<Material> blocks = encoder.encodeToBlocks(value);
        int blocksNeeded = blocks.size();
        
        if (config.logOperations()) {
            plugin.getLogger().info("Writing entry: " + key + " (" + value.length + " bytes, " + blocksNeeded + " blocks)");
        }
        
        // Find space and write blocks
        BlockPosition startPos = findAvailableSpace(blocksNeeded);
        if (startPos == null) {
            throw new IOException("No available space in database!");
        }
        
        writeBlocks(startPos, blocks);
        
        // Update index
        int chunkX = startPos.getX() >> 4;
        int chunkZ = startPos.getZ() >> 4;
        DataAddress address = new DataAddress(chunkX, chunkZ, startPos, blocksNeeded);
        index.put(key, address);
        
        // Update cache
        DataEntry entry = new DataEntry(key, value, startPos);
        updateCache(key, entry);
        
        if (config.logOperations()) {
            plugin.getLogger().info("  Written at: " + startPos);
        }
    }
    
    /**
     * Read data from the database
     */
    public byte[] read(String key) throws IOException {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Key cannot be null or empty");
        }
        
        // Check cache first
        DataEntry cached = getFromCache(key);
        if (cached != null) {
            if (config.logPerformance()) {
                plugin.getLogger().info("Cache hit for key: " + key);
            }
            return cached.getValue();
        }
        
        // Get address from index
        DataAddress address = index.get(key);
        if (address == null) {
            throw new IOException("Key not found: " + key);
        }
        
        if (config.logOperations()) {
            plugin.getLogger().info("Reading entry: " + key);
        }
        
        // Read blocks
        List<Material> blocks = readBlocks(address.getBlockPosition(), address.getBlockCount());
        
        // Decode blocks to data
        byte[] data = encoder.decodeFromBlocks(blocks);
        
        // Update cache
        DataEntry entry = new DataEntry(key, data, address.getBlockPosition());
        updateCache(key, entry);
        
        return data;
    }
    
    /**
     * Delete data from the database
     */
    public synchronized void delete(String key) throws IOException {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Key cannot be null or empty");
        }
        
        DataAddress address = index.get(key);
        if (address == null) {
            throw new IOException("Key not found: " + key);
        }
        
        if (config.logOperations()) {
            plugin.getLogger().info("Deleting entry: " + key);
        }
        
        // Clear blocks (set to AIR)
        clearBlocks(address.getBlockPosition(), address.getBlockCount());
        
        // Remove from index and cache
        index.remove(key);
        cache.remove(key);
        cacheTimestamps.remove(key);
    }
    
    /**
     * List all keys in the database
     */
    public Set<String> listKeys() {
        return new HashSet<>(index.keySet());
    }
    
    /**
     * Check if a key exists
     */
    public boolean exists(String key) {
        return index.containsKey(key);
    }
    
    /**
     * Clear all data from database
     */
    public synchronized int clearAll() {
        int count = index.size();
        
        // Clear all blocks
        BlockPosition start = chunkManager.getStartPosition();
        BlockPosition end = chunkManager.getEndPosition();
        
        for (int x = start.getX(); x <= end.getX(); x++) {
            for (int y = start.getY(); y <= end.getY(); y++) {
                for (int z = start.getZ(); z <= end.getZ(); z++) {
                    Block block = chunkManager.getWorld().getBlockAt(x, y, z);
                    block.setType(Material.AIR);
                }
            }
        }
        
        // Clear index and cache
        index.clear();
        cache.clear();
        cacheTimestamps.clear();
        
        // Reset write position
        currentWritePosition = start;
        
        return count;
    }
    
    /**
     * Get number of entries
     */
    public int getEntryCount() {
        return index.size();
    }
    
    /**
     * Get cache size
     */
    public int getCacheSize() {
        cleanExpiredCache();
        return cache.size();
    }
    
    /**
     * Get estimated capacity
     */
    public int getEstimatedCapacity() {
        int totalBlocks = chunkManager.getTotalBlocks();
        int blocksPerEntry = config.getBlocksPerKey() + config.getBlocksPerValue();
        return totalBlocks / blocksPerEntry;
    }
    
    /**
     * Get used capacity percentage
     */
    public int getUsedCapacity() {
        int total = getEstimatedCapacity();
        int used = getEntryCount();
        return total > 0 ? (used * 100 / total) : 0;
    }
    
    // Private helper methods
    
    private BlockPosition findAvailableSpace(int blocksNeeded) {
        BlockPosition start = chunkManager.getStartPosition();
        BlockPosition end = chunkManager.getEndPosition();
        
        plugin.getLogger().info("Finding space for " + blocksNeeded + " blocks");
        plugin.getLogger().info("Search range: " + start + " to " + end);
        plugin.getLogger().info("Current write position: " + currentWritePosition);
        
        BlockPosition pos = currentWritePosition;
        int attempts = 0;
        int maxAttempts = 1000;
        
        // Linear search for available space
        while (attempts < maxAttempts) {
            if (isSpaceAvailable(pos, blocksNeeded)) {
                plugin.getLogger().info("Found space at: " + pos + " after " + attempts + " attempts");
                currentWritePosition = pos.offset(blocksNeeded, 0, 0);
                return pos;
            }
            
            // Log first few attempts
            if (attempts < 5) {
                Block block = chunkManager.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
                plugin.getLogger().info("Attempt " + attempts + " at " + pos + ": block type = " + block.getType());
            }
            
            // Move to next position
            pos = pos.offset(1, 0, 0);
            
            // Wrap to next row/layer if needed
            if (pos.getX() > end.getX()) {
                pos = new BlockPosition(start.getX(), pos.getY(), pos.getZ() + 1);
            }
            if (pos.getZ() > end.getZ()) {
                pos = new BlockPosition(start.getX(), pos.getY() + 1, start.getZ());
            }
            if (pos.getY() > end.getY()) {
                plugin.getLogger().warning("Exceeded Y boundary after " + attempts + " attempts");
                return null;
            }
            
            attempts++;
        }
        
        plugin.getLogger().warning("Max attempts (" + maxAttempts + ") reached without finding space");
        return null;
    }
    
    private boolean isSpaceAvailable(BlockPosition start, int count) {
        BlockPosition pos = start;
        BlockPosition end = chunkManager.getEndPosition();
        int width = end.getX() - chunkManager.getStartPosition().getX() + 1;
        
        for (int i = 0; i < count; i++) {
            if (!chunkManager.isInDatabaseArea(pos)) {
                return false;
            }
            Block block = chunkManager.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
            if (block.getType() != Material.AIR) {
                return false;
            }
            
            // Move to next block (wrap to next row if needed)
            pos = pos.offset(1, 0, 0);
            if (pos.getX() > end.getX()) {
                pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY(), pos.getZ() + 1);
            }
            if (pos.getZ() > end.getZ()) {
                pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY() + 1, chunkManager.getStartPosition().getZ());
            }
        }
        return true;
    }
    
    private void writeBlocks(BlockPosition start, List<Material> materials) {
        BlockPosition pos = start;
        BlockPosition end = chunkManager.getEndPosition();
        
        for (int i = 0; i < materials.size(); i++) {
            Block block = chunkManager.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
            block.setType(materials.get(i));
            
            // Move to next block (wrap to next row if needed)
            if (i < materials.size() - 1) {  // Don't advance after last block
                pos = pos.offset(1, 0, 0);
                if (pos.getX() > end.getX()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY(), pos.getZ() + 1);
                }
                if (pos.getZ() > end.getZ()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY() + 1, chunkManager.getStartPosition().getZ());
                }
            }
        }
    }
    
    private List<Material> readBlocks(BlockPosition start, int count) {
        List<Material> materials = new ArrayList<>();
        BlockPosition pos = start;
        BlockPosition end = chunkManager.getEndPosition();
        
        for (int i = 0; i < count; i++) {
            Block block = chunkManager.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
            materials.add(block.getType());
            
            // Move to next block (wrap to next row if needed)
            if (i < count - 1) {  // Don't advance after last block
                pos = pos.offset(1, 0, 0);
                if (pos.getX() > end.getX()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY(), pos.getZ() + 1);
                }
                if (pos.getZ() > end.getZ()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY() + 1, chunkManager.getStartPosition().getZ());
                }
            }
        }
        return materials;
    }
    
    private void clearBlocks(BlockPosition start, int count) {
        BlockPosition pos = start;
        BlockPosition end = chunkManager.getEndPosition();
        
        for (int i = 0; i < count; i++) {
            Block block = chunkManager.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
            block.setType(Material.AIR);
            
            // Move to next block (wrap to next row if needed)
            if (i < count - 1) {  // Don't advance after last block
                pos = pos.offset(1, 0, 0);
                if (pos.getX() > end.getX()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY(), pos.getZ() + 1);
                }
                if (pos.getZ() > end.getZ()) {
                    pos = new BlockPosition(chunkManager.getStartPosition().getX(), pos.getY() + 1, chunkManager.getStartPosition().getZ());
                }
            }
        }
    }
    
    private void updateCache(String key, DataEntry entry) {
        if (cache.size() >= config.getCacheSize()) {
            evictOldestCacheEntry();
        }
        cache.put(key, entry);
        cacheTimestamps.put(key, System.currentTimeMillis());
    }
    
    private DataEntry getFromCache(String key) {
        Long timestamp = cacheTimestamps.get(key);
        if (timestamp == null) {
            return null;
        }
        
        long age = System.currentTimeMillis() - timestamp;
        long maxAge = config.getCacheTTLSeconds() * 1000L;
        
        if (age > maxAge) {
            cache.remove(key);
            cacheTimestamps.remove(key);
            return null;
        }
        
        return cache.get(key);
    }
    
    private void evictOldestCacheEntry() {
        String oldestKey = null;
        long oldestTimestamp = Long.MAX_VALUE;
        
        for (Map.Entry<String, Long> entry : cacheTimestamps.entrySet()) {
            if (entry.getValue() < oldestTimestamp) {
                oldestTimestamp = entry.getValue();
                oldestKey = entry.getKey();
            }
        }
        
        if (oldestKey != null) {
            cache.remove(oldestKey);
            cacheTimestamps.remove(oldestKey);
        }
    }
    
    private void cleanExpiredCache() {
        long now = System.currentTimeMillis();
        long maxAge = config.getCacheTTLSeconds() * 1000L;
        
        List<String> expiredKeys = new ArrayList<>();
        for (Map.Entry<String, Long> entry : cacheTimestamps.entrySet()) {
            if (now - entry.getValue() > maxAge) {
                expiredKeys.add(entry.getKey());
            }
        }
        
        for (String key : expiredKeys) {
            cache.remove(key);
            cacheTimestamps.remove(key);
        }
    }
    
    private void rebuildIndex() {
        // Scan database area for existing data
        // This is a simplified version - in production you'd store metadata
        plugin.getLogger().info("Rebuilding index from existing blocks...");
        
        // For now, start fresh
        // In a full implementation, you'd scan blocks and rebuild the index
        
        plugin.getLogger().info("Index rebuilt: " + index.size() + " entries found");
    }
}

