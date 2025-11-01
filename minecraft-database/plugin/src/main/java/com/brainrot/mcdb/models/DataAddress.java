package com.brainrot.mcdb.models;

public class DataAddress {
    
    private final int chunkX;
    private final int chunkZ;
    private final BlockPosition blockPosition;
    private final int blockCount;
    
    public DataAddress(int chunkX, int chunkZ, BlockPosition blockPosition, int blockCount) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.blockPosition = blockPosition;
        this.blockCount = blockCount;
    }
    
    public int getChunkX() {
        return chunkX;
    }
    
    public int getChunkZ() {
        return chunkZ;
    }
    
    public BlockPosition getBlockPosition() {
        return blockPosition;
    }
    
    public int getBlockCount() {
        return blockCount;
    }
    
    @Override
    public String toString() {
        return "DataAddress{" +
                "chunk=(" + chunkX + ", " + chunkZ + ")" +
                ", position=" + blockPosition +
                ", blocks=" + blockCount +
                '}';
    }
}

