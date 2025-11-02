package com.brainrot.mcdb.database;

import org.bukkit.Material;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.io.ByteArrayInputStream;

/**
 * Optimized Data Encoder using 256 block types for base-256 encoding
 * 
 * EFFICIENCY COMPARISON:
 * - Old (16 blocks):  Base-16, 4 bits/block, 2 blocks/byte
 * - New (256 blocks): Base-256, 8 bits/block, 1 block/byte
 * 
 * SPACE SAVINGS: 50% reduction!
 * CAPACITY INCREASE: 2x more data in same space!
 */
public class DataEncoderOptimized {
    
    /**
     * Full 256-block palette for base-256 encoding
     * Each block represents one byte (0-255)
     * 
     * Organized by categories for visual organization:
     * - Stone variants (0-31)
     * - Wood variants (32-63)
     * - Wool colors (64-79)
     * - Terracotta colors (80-95)
     * - Concrete (96-111)
     * - Concrete powder (112-127)
     * - Ores and minerals (128-159)
     * - Plants and organic (160-191)
     * - Construction blocks (192-223)
     * - Decorative blocks (224-255)
     */
    private static final Material[] FULL_PALETTE = new Material[256];
    private static final Map<Material, Integer> MATERIAL_TO_VALUE = new HashMap<>();
    
    static {
        // Stone variants (0-31)
        FULL_PALETTE[0] = Material.STONE;
        FULL_PALETTE[1] = Material.GRANITE;
        FULL_PALETTE[2] = Material.POLISHED_GRANITE;
        FULL_PALETTE[3] = Material.DIORITE;
        FULL_PALETTE[4] = Material.POLISHED_DIORITE;
        FULL_PALETTE[5] = Material.ANDESITE;
        FULL_PALETTE[6] = Material.POLISHED_ANDESITE;
        FULL_PALETTE[7] = Material.COBBLESTONE;
        FULL_PALETTE[8] = Material.MOSSY_COBBLESTONE;
        FULL_PALETTE[9] = Material.STONE_BRICKS;
        FULL_PALETTE[10] = Material.MOSSY_STONE_BRICKS;
        FULL_PALETTE[11] = Material.CRACKED_STONE_BRICKS;
        FULL_PALETTE[12] = Material.CHISELED_STONE_BRICKS;
        FULL_PALETTE[13] = Material.SMOOTH_STONE;
        FULL_PALETTE[14] = Material.SANDSTONE;
        FULL_PALETTE[15] = Material.SMOOTH_SANDSTONE;
        FULL_PALETTE[16] = Material.CHISELED_SANDSTONE;
        FULL_PALETTE[17] = Material.CUT_SANDSTONE;
        FULL_PALETTE[18] = Material.RED_SANDSTONE;
        FULL_PALETTE[19] = Material.SMOOTH_RED_SANDSTONE;
        FULL_PALETTE[20] = Material.CHISELED_RED_SANDSTONE;
        FULL_PALETTE[21] = Material.CUT_RED_SANDSTONE;
        FULL_PALETTE[22] = Material.BRICKS;
        FULL_PALETTE[23] = Material.PRISMARINE;
        FULL_PALETTE[24] = Material.PRISMARINE_BRICKS;
        FULL_PALETTE[25] = Material.DARK_PRISMARINE;
        FULL_PALETTE[26] = Material.NETHER_BRICKS;
        FULL_PALETTE[27] = Material.RED_NETHER_BRICKS;
        FULL_PALETTE[28] = Material.END_STONE;
        FULL_PALETTE[29] = Material.END_STONE_BRICKS;
        FULL_PALETTE[30] = Material.PURPUR_BLOCK;
        FULL_PALETTE[31] = Material.PURPUR_PILLAR;
        
        // Wood variants (32-63)
        FULL_PALETTE[32] = Material.OAK_PLANKS;
        FULL_PALETTE[33] = Material.SPRUCE_PLANKS;
        FULL_PALETTE[34] = Material.BIRCH_PLANKS;
        FULL_PALETTE[35] = Material.JUNGLE_PLANKS;
        FULL_PALETTE[36] = Material.ACACIA_PLANKS;
        FULL_PALETTE[37] = Material.DARK_OAK_PLANKS;
        FULL_PALETTE[38] = Material.CRIMSON_PLANKS;
        FULL_PALETTE[39] = Material.WARPED_PLANKS;
        FULL_PALETTE[40] = Material.OAK_LOG;
        FULL_PALETTE[41] = Material.SPRUCE_LOG;
        FULL_PALETTE[42] = Material.BIRCH_LOG;
        FULL_PALETTE[43] = Material.JUNGLE_LOG;
        FULL_PALETTE[44] = Material.ACACIA_LOG;
        FULL_PALETTE[45] = Material.DARK_OAK_LOG;
        FULL_PALETTE[46] = Material.CRIMSON_STEM;
        FULL_PALETTE[47] = Material.WARPED_STEM;
        FULL_PALETTE[48] = Material.STRIPPED_OAK_LOG;
        FULL_PALETTE[49] = Material.STRIPPED_SPRUCE_LOG;
        FULL_PALETTE[50] = Material.STRIPPED_BIRCH_LOG;
        FULL_PALETTE[51] = Material.STRIPPED_JUNGLE_LOG;
        FULL_PALETTE[52] = Material.STRIPPED_ACACIA_LOG;
        FULL_PALETTE[53] = Material.STRIPPED_DARK_OAK_LOG;
        FULL_PALETTE[54] = Material.STRIPPED_CRIMSON_STEM;
        FULL_PALETTE[55] = Material.STRIPPED_WARPED_STEM;
        FULL_PALETTE[56] = Material.OAK_WOOD;
        FULL_PALETTE[57] = Material.SPRUCE_WOOD;
        FULL_PALETTE[58] = Material.BIRCH_WOOD;
        FULL_PALETTE[59] = Material.JUNGLE_WOOD;
        FULL_PALETTE[60] = Material.ACACIA_WOOD;
        FULL_PALETTE[61] = Material.DARK_OAK_WOOD;
        FULL_PALETTE[62] = Material.CRIMSON_HYPHAE;
        FULL_PALETTE[63] = Material.WARPED_HYPHAE;
        
        // Wool colors (64-79)
        FULL_PALETTE[64] = Material.WHITE_WOOL;
        FULL_PALETTE[65] = Material.ORANGE_WOOL;
        FULL_PALETTE[66] = Material.MAGENTA_WOOL;
        FULL_PALETTE[67] = Material.LIGHT_BLUE_WOOL;
        FULL_PALETTE[68] = Material.YELLOW_WOOL;
        FULL_PALETTE[69] = Material.LIME_WOOL;
        FULL_PALETTE[70] = Material.PINK_WOOL;
        FULL_PALETTE[71] = Material.GRAY_WOOL;
        FULL_PALETTE[72] = Material.LIGHT_GRAY_WOOL;
        FULL_PALETTE[73] = Material.CYAN_WOOL;
        FULL_PALETTE[74] = Material.PURPLE_WOOL;
        FULL_PALETTE[75] = Material.BLUE_WOOL;
        FULL_PALETTE[76] = Material.BROWN_WOOL;
        FULL_PALETTE[77] = Material.GREEN_WOOL;
        FULL_PALETTE[78] = Material.RED_WOOL;
        FULL_PALETTE[79] = Material.BLACK_WOOL;
        
        // Terracotta colors (80-95)
        FULL_PALETTE[80] = Material.WHITE_TERRACOTTA;
        FULL_PALETTE[81] = Material.ORANGE_TERRACOTTA;
        FULL_PALETTE[82] = Material.MAGENTA_TERRACOTTA;
        FULL_PALETTE[83] = Material.LIGHT_BLUE_TERRACOTTA;
        FULL_PALETTE[84] = Material.YELLOW_TERRACOTTA;
        FULL_PALETTE[85] = Material.LIME_TERRACOTTA;
        FULL_PALETTE[86] = Material.PINK_TERRACOTTA;
        FULL_PALETTE[87] = Material.GRAY_TERRACOTTA;
        FULL_PALETTE[88] = Material.LIGHT_GRAY_TERRACOTTA;
        FULL_PALETTE[89] = Material.CYAN_TERRACOTTA;
        FULL_PALETTE[90] = Material.PURPLE_TERRACOTTA;
        FULL_PALETTE[91] = Material.BLUE_TERRACOTTA;
        FULL_PALETTE[92] = Material.BROWN_TERRACOTTA;
        FULL_PALETTE[93] = Material.GREEN_TERRACOTTA;
        FULL_PALETTE[94] = Material.RED_TERRACOTTA;
        FULL_PALETTE[95] = Material.BLACK_TERRACOTTA;
        
        // Concrete (96-111)
        FULL_PALETTE[96] = Material.WHITE_CONCRETE;
        FULL_PALETTE[97] = Material.ORANGE_CONCRETE;
        FULL_PALETTE[98] = Material.MAGENTA_CONCRETE;
        FULL_PALETTE[99] = Material.LIGHT_BLUE_CONCRETE;
        FULL_PALETTE[100] = Material.YELLOW_CONCRETE;
        FULL_PALETTE[101] = Material.LIME_CONCRETE;
        FULL_PALETTE[102] = Material.PINK_CONCRETE;
        FULL_PALETTE[103] = Material.GRAY_CONCRETE;
        FULL_PALETTE[104] = Material.LIGHT_GRAY_CONCRETE;
        FULL_PALETTE[105] = Material.CYAN_CONCRETE;
        FULL_PALETTE[106] = Material.PURPLE_CONCRETE;
        FULL_PALETTE[107] = Material.BLUE_CONCRETE;
        FULL_PALETTE[108] = Material.BROWN_CONCRETE;
        FULL_PALETTE[109] = Material.GREEN_CONCRETE;
        FULL_PALETTE[110] = Material.RED_CONCRETE;
        FULL_PALETTE[111] = Material.BLACK_CONCRETE;
        
        // Concrete powder (112-127)
        FULL_PALETTE[112] = Material.WHITE_CONCRETE_POWDER;
        FULL_PALETTE[113] = Material.ORANGE_CONCRETE_POWDER;
        FULL_PALETTE[114] = Material.MAGENTA_CONCRETE_POWDER;
        FULL_PALETTE[115] = Material.LIGHT_BLUE_CONCRETE_POWDER;
        FULL_PALETTE[116] = Material.YELLOW_CONCRETE_POWDER;
        FULL_PALETTE[117] = Material.LIME_CONCRETE_POWDER;
        FULL_PALETTE[118] = Material.PINK_CONCRETE_POWDER;
        FULL_PALETTE[119] = Material.GRAY_CONCRETE_POWDER;
        FULL_PALETTE[120] = Material.LIGHT_GRAY_CONCRETE_POWDER;
        FULL_PALETTE[121] = Material.CYAN_CONCRETE_POWDER;
        FULL_PALETTE[122] = Material.PURPLE_CONCRETE_POWDER;
        FULL_PALETTE[123] = Material.BLUE_CONCRETE_POWDER;
        FULL_PALETTE[124] = Material.BROWN_CONCRETE_POWDER;
        FULL_PALETTE[125] = Material.GREEN_CONCRETE_POWDER;
        FULL_PALETTE[126] = Material.RED_CONCRETE_POWDER;
        FULL_PALETTE[127] = Material.BLACK_CONCRETE_POWDER;
        
        // Ores and minerals (128-159)
        FULL_PALETTE[128] = Material.COAL_ORE;
        FULL_PALETTE[129] = Material.DEEPSLATE_COAL_ORE;
        FULL_PALETTE[130] = Material.IRON_ORE;
        FULL_PALETTE[131] = Material.DEEPSLATE_IRON_ORE;
        FULL_PALETTE[132] = Material.COPPER_ORE;
        FULL_PALETTE[133] = Material.DEEPSLATE_COPPER_ORE;
        FULL_PALETTE[134] = Material.GOLD_ORE;
        FULL_PALETTE[135] = Material.DEEPSLATE_GOLD_ORE;
        FULL_PALETTE[136] = Material.REDSTONE_ORE;
        FULL_PALETTE[137] = Material.DEEPSLATE_REDSTONE_ORE;
        FULL_PALETTE[138] = Material.EMERALD_ORE;
        FULL_PALETTE[139] = Material.DEEPSLATE_EMERALD_ORE;
        FULL_PALETTE[140] = Material.LAPIS_ORE;
        FULL_PALETTE[141] = Material.DEEPSLATE_LAPIS_ORE;
        FULL_PALETTE[142] = Material.DIAMOND_ORE;
        FULL_PALETTE[143] = Material.DEEPSLATE_DIAMOND_ORE;
        FULL_PALETTE[144] = Material.COAL_BLOCK;
        FULL_PALETTE[145] = Material.IRON_BLOCK;
        FULL_PALETTE[146] = Material.COPPER_BLOCK;
        FULL_PALETTE[147] = Material.GOLD_BLOCK;
        FULL_PALETTE[148] = Material.REDSTONE_BLOCK;
        FULL_PALETTE[149] = Material.EMERALD_BLOCK;
        FULL_PALETTE[150] = Material.LAPIS_BLOCK;
        FULL_PALETTE[151] = Material.DIAMOND_BLOCK;
        FULL_PALETTE[152] = Material.NETHERITE_BLOCK;
        FULL_PALETTE[153] = Material.QUARTZ_BLOCK;
        FULL_PALETTE[154] = Material.SMOOTH_QUARTZ;
        FULL_PALETTE[155] = Material.QUARTZ_BRICKS;
        FULL_PALETTE[156] = Material.CHISELED_QUARTZ_BLOCK;
        FULL_PALETTE[157] = Material.QUARTZ_PILLAR;
        FULL_PALETTE[158] = Material.GLOWSTONE;
        FULL_PALETTE[159] = Material.SEA_LANTERN;
        
        // Plants and organic (160-191)
        FULL_PALETTE[160] = Material.DIRT;
        FULL_PALETTE[161] = Material.COARSE_DIRT;
        FULL_PALETTE[162] = Material.GRASS_BLOCK;
        FULL_PALETTE[163] = Material.PODZOL;
        FULL_PALETTE[164] = Material.MYCELIUM;
        FULL_PALETTE[165] = Material.SAND;
        FULL_PALETTE[166] = Material.RED_SAND;
        FULL_PALETTE[167] = Material.GRAVEL;
        FULL_PALETTE[168] = Material.CLAY;
        FULL_PALETTE[169] = Material.SPONGE;
        FULL_PALETTE[170] = Material.WET_SPONGE;
        FULL_PALETTE[171] = Material.MOSS_BLOCK;
        FULL_PALETTE[172] = Material.HAY_BLOCK;
        FULL_PALETTE[173] = Material.DRIED_KELP_BLOCK;
        FULL_PALETTE[174] = Material.BONE_BLOCK;
        FULL_PALETTE[175] = Material.SLIME_BLOCK;
        FULL_PALETTE[176] = Material.HONEY_BLOCK;
        FULL_PALETTE[177] = Material.MELON;
        FULL_PALETTE[178] = Material.PUMPKIN;
        FULL_PALETTE[179] = Material.CARVED_PUMPKIN;
        FULL_PALETTE[180] = Material.JACK_O_LANTERN;
        FULL_PALETTE[181] = Material.SHROOMLIGHT;
        FULL_PALETTE[182] = Material.BROWN_MUSHROOM_BLOCK;
        FULL_PALETTE[183] = Material.RED_MUSHROOM_BLOCK;
        FULL_PALETTE[184] = Material.MUSHROOM_STEM;
        FULL_PALETTE[185] = Material.NETHER_WART_BLOCK;
        FULL_PALETTE[186] = Material.WARPED_WART_BLOCK;
        FULL_PALETTE[187] = Material.SOUL_SAND;
        FULL_PALETTE[188] = Material.SOUL_SOIL;
        FULL_PALETTE[189] = Material.BASALT;
        FULL_PALETTE[190] = Material.SMOOTH_BASALT;
        FULL_PALETTE[191] = Material.POLISHED_BASALT;
        
        // Construction blocks (192-223)
        FULL_PALETTE[192] = Material.GLASS;
        FULL_PALETTE[193] = Material.WHITE_STAINED_GLASS;
        FULL_PALETTE[194] = Material.ORANGE_STAINED_GLASS;
        FULL_PALETTE[195] = Material.MAGENTA_STAINED_GLASS;
        FULL_PALETTE[196] = Material.LIGHT_BLUE_STAINED_GLASS;
        FULL_PALETTE[197] = Material.YELLOW_STAINED_GLASS;
        FULL_PALETTE[198] = Material.LIME_STAINED_GLASS;
        FULL_PALETTE[199] = Material.PINK_STAINED_GLASS;
        FULL_PALETTE[200] = Material.GRAY_STAINED_GLASS;
        FULL_PALETTE[201] = Material.LIGHT_GRAY_STAINED_GLASS;
        FULL_PALETTE[202] = Material.CYAN_STAINED_GLASS;
        FULL_PALETTE[203] = Material.PURPLE_STAINED_GLASS;
        FULL_PALETTE[204] = Material.BLUE_STAINED_GLASS;
        FULL_PALETTE[205] = Material.BROWN_STAINED_GLASS;
        FULL_PALETTE[206] = Material.GREEN_STAINED_GLASS;
        FULL_PALETTE[207] = Material.RED_STAINED_GLASS;
        FULL_PALETTE[208] = Material.BLACK_STAINED_GLASS;
        FULL_PALETTE[209] = Material.TNT;
        FULL_PALETTE[210] = Material.BOOKSHELF;
        FULL_PALETTE[211] = Material.OBSIDIAN;
        FULL_PALETTE[212] = Material.CRYING_OBSIDIAN;
        FULL_PALETTE[213] = Material.ICE;
        FULL_PALETTE[214] = Material.PACKED_ICE;
        FULL_PALETTE[215] = Material.BLUE_ICE;
        FULL_PALETTE[216] = Material.SNOW_BLOCK;
        FULL_PALETTE[217] = Material.MAGMA_BLOCK;
        FULL_PALETTE[218] = Material.NETHERRACK;
        FULL_PALETTE[219] = Material.CRIMSON_NYLIUM;
        FULL_PALETTE[220] = Material.WARPED_NYLIUM;
        FULL_PALETTE[221] = Material.ANCIENT_DEBRIS;
        FULL_PALETTE[222] = Material.RESPAWN_ANCHOR;
        FULL_PALETTE[223] = Material.LODESTONE;
        
        // Decorative blocks (224-255)
        FULL_PALETTE[224] = Material.WHITE_GLAZED_TERRACOTTA;
        FULL_PALETTE[225] = Material.ORANGE_GLAZED_TERRACOTTA;
        FULL_PALETTE[226] = Material.MAGENTA_GLAZED_TERRACOTTA;
        FULL_PALETTE[227] = Material.LIGHT_BLUE_GLAZED_TERRACOTTA;
        FULL_PALETTE[228] = Material.YELLOW_GLAZED_TERRACOTTA;
        FULL_PALETTE[229] = Material.LIME_GLAZED_TERRACOTTA;
        FULL_PALETTE[230] = Material.PINK_GLAZED_TERRACOTTA;
        FULL_PALETTE[231] = Material.GRAY_GLAZED_TERRACOTTA;
        FULL_PALETTE[232] = Material.LIGHT_GRAY_GLAZED_TERRACOTTA;
        FULL_PALETTE[233] = Material.CYAN_GLAZED_TERRACOTTA;
        FULL_PALETTE[234] = Material.PURPLE_GLAZED_TERRACOTTA;
        FULL_PALETTE[235] = Material.BLUE_GLAZED_TERRACOTTA;
        FULL_PALETTE[236] = Material.BROWN_GLAZED_TERRACOTTA;
        FULL_PALETTE[237] = Material.GREEN_GLAZED_TERRACOTTA;
        FULL_PALETTE[238] = Material.RED_GLAZED_TERRACOTTA;
        FULL_PALETTE[239] = Material.BLACK_GLAZED_TERRACOTTA;
        FULL_PALETTE[240] = Material.BEACON;
        FULL_PALETTE[241] = Material.CONDUIT;
        FULL_PALETTE[242] = Material.TARGET;
        FULL_PALETTE[243] = Material.JUKEBOX;
        FULL_PALETTE[244] = Material.NOTE_BLOCK;
        FULL_PALETTE[245] = Material.REDSTONE_LAMP;
        FULL_PALETTE[246] = Material.SPONGE;
        FULL_PALETTE[247] = Material.DRIED_KELP_BLOCK;
        FULL_PALETTE[248] = Material.CHISELED_NETHER_BRICKS;
        FULL_PALETTE[249] = Material.CRACKED_NETHER_BRICKS;
        FULL_PALETTE[250] = Material.CHISELED_POLISHED_BLACKSTONE;
        FULL_PALETTE[251] = Material.GILDED_BLACKSTONE;
        FULL_PALETTE[252] = Material.CRACKED_POLISHED_BLACKSTONE_BRICKS;
        FULL_PALETTE[253] = Material.CHISELED_DEEPSLATE;
        FULL_PALETTE[254] = Material.CRACKED_DEEPSLATE_BRICKS;
        FULL_PALETTE[255] = Material.DEEPSLATE_TILES;
        
        // Build reverse lookup map
        for (int i = 0; i < FULL_PALETTE.length; i++) {
            MATERIAL_TO_VALUE.put(FULL_PALETTE[i], i);
        }
    }
    
    private final boolean useCompression;
    
    public DataEncoderOptimized(boolean useCompression) {
        this.useCompression = useCompression;
    }
    
    /**
     * Encode bytes into a list of Materials
     * Optimized encoding: 1 block per byte (8 bits per block)
     * 
     * This is 50% more efficient than the old 2-block-per-byte approach!
     */
    public List<Material> encodeToBlocks(byte[] data) throws IOException {
        byte[] processedData = useCompression ? compress(data) : data;
        List<Material> blocks = new ArrayList<>(processedData.length);
        
        for (byte b : processedData) {
            // Convert byte to unsigned value (0-255)
            int value = Byte.toUnsignedInt(b);
            blocks.add(FULL_PALETTE[value]);
        }
        
        return blocks;
    }
    
    /**
     * Decode a list of Materials back into bytes
     */
    public byte[] decodeFromBlocks(List<Material> blocks) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(blocks.size());
        
        for (Material material : blocks) {
            Integer value = MATERIAL_TO_VALUE.get(material);
            if (value == null) {
                // Unknown block, default to 0 (STONE)
                value = 0;
            }
            baos.write(value.byteValue());
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
     * Calculate how many blocks are needed to store data
     */
    public int calculateBlocksNeeded(byte[] data) throws IOException {
        byte[] processedData = useCompression ? compress(data) : data;
        return processedData.length; // 1 block per byte in optimized encoding!
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
        if (value < 0 || value >= FULL_PALETTE.length) {
            return FULL_PALETTE[0];
        }
        return FULL_PALETTE[value];
    }
    
    /**
     * Get value for material
     */
    public static Integer getValueForMaterial(Material material) {
        return MATERIAL_TO_VALUE.get(material);
    }
    
    /**
     * Get palette size
     */
    public static int getPaletteSize() {
        return FULL_PALETTE.length;
    }
    
    /**
     * Check if a material is in the palette
     */
    public static boolean isInPalette(Material material) {
        return MATERIAL_TO_VALUE.containsKey(material);
    }
}

