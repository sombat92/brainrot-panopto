package com.brainrot.mcdb.database;

import org.bukkit.Material;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.io.ByteArrayInputStream;

public class DataEncoder {
    
    // Simple encoding: 16 block types = 4 bits per block
    private static final Material[] SIMPLE_PALETTE = {
        Material.STONE,              // 0000
        Material.GRANITE,            // 0001
        Material.POLISHED_GRANITE,   // 0010
        Material.DIORITE,            // 0011
        Material.OAK_PLANKS,         // 0100
        Material.SPRUCE_PLANKS,      // 0101
        Material.BIRCH_PLANKS,       // 0110
        Material.JUNGLE_PLANKS,      // 0111
        Material.WHITE_WOOL,         // 1000
        Material.ORANGE_WOOL,        // 1001
        Material.MAGENTA_WOOL,       // 1010
        Material.LIGHT_BLUE_WOOL,    // 1011
        Material.YELLOW_WOOL,        // 1100
        Material.LIME_WOOL,          // 1101
        Material.PINK_WOOL,          // 1110
        Material.GRAY_WOOL           // 1111
    };
    
    private final boolean useCompression;
    
    public DataEncoder(boolean useCompression) {
        this.useCompression = useCompression;
    }
    
    /**
     * Encode bytes into a list of Materials
     * Simple encoding: 2 blocks per byte (4 bits per block)
     */
    public List<Material> encodeToBlocks(byte[] data) throws IOException {
        byte[] processedData = useCompression ? compress(data) : data;
        List<Material> blocks = new ArrayList<>();
        
        for (byte b : processedData) {
            // High nibble (upper 4 bits)
            int highNibble = (b >> 4) & 0x0F;
            blocks.add(SIMPLE_PALETTE[highNibble]);
            
            // Low nibble (lower 4 bits)
            int lowNibble = b & 0x0F;
            blocks.add(SIMPLE_PALETTE[lowNibble]);
        }
        
        return blocks;
    }
    
    /**
     * Decode a list of Materials back into bytes
     */
    public byte[] decodeFromBlocks(List<Material> blocks) throws IOException {
        if (blocks.size() % 2 != 0) {
            throw new IllegalArgumentException("Block list must have even number of blocks");
        }
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        for (int i = 0; i < blocks.size(); i += 2) {
            int highNibble = getMaterialValue(blocks.get(i));
            int lowNibble = getMaterialValue(blocks.get(i + 1));
            
            byte value = (byte) ((highNibble << 4) | lowNibble);
            baos.write(value);
        }
        
        byte[] data = baos.toByteArray();
        return useCompression ? decompress(data) : data;
    }
    
    /**
     * Encode a string into blocks
     */
    public List<Material> encodeStringToBlocks(String str) throws IOException {
        return encodeToBlocks(str.getBytes("UTF-8"));
    }
    
    /**
     * Decode blocks into a string
     */
    public String decodeBlocksToString(List<Material> blocks) throws IOException {
        byte[] data = decodeFromBlocks(blocks);
        return new String(data, "UTF-8");
    }
    
    /**
     * Get the value (0-15) for a material
     */
    private int getMaterialValue(Material material) {
        for (int i = 0; i < SIMPLE_PALETTE.length; i++) {
            if (SIMPLE_PALETTE[i] == material) {
                return i;
            }
        }
        // Default to STONE if not found
        return 0;
    }
    
    /**
     * Calculate how many blocks are needed to store data
     */
    public int calculateBlocksNeeded(byte[] data) throws IOException {
        byte[] processedData = useCompression ? compress(data) : data;
        return processedData.length * 2; // 2 blocks per byte in simple encoding
    }
    
    /**
     * Calculate how many blocks are needed for a string
     */
    public int calculateBlocksNeeded(String str) throws IOException {
        return calculateBlocksNeeded(str.getBytes("UTF-8"));
    }
    
    /**
     * Compress data using GZIP
     */
    private byte[] compress(byte[] data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPOutputStream gzipOut = new GZIPOutputStream(baos)) {
            gzipOut.write(data);
        }
        return baos.toByteArray();
    }
    
    /**
     * Decompress GZIP data
     */
    private byte[] decompress(byte[] compressed) throws IOException {
        ByteArrayInputStream bais = new ByteArrayInputStream(compressed);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try (GZIPInputStream gzipIn = new GZIPInputStream(bais)) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzipIn.read(buffer)) > 0) {
                baos.write(buffer, 0, len);
            }
        }
        
        return baos.toByteArray();
    }
    
    /**
     * Get material at index in palette
     */
    public static Material getMaterialForValue(int value) {
        if (value < 0 || value >= SIMPLE_PALETTE.length) {
            return SIMPLE_PALETTE[0];
        }
        return SIMPLE_PALETTE[value];
    }
    
    /**
     * Get palette size
     */
    public static int getPaletteSize() {
        return SIMPLE_PALETTE.length;
    }
}

