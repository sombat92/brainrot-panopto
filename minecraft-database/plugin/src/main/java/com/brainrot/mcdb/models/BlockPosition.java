package com.brainrot.mcdb.models;

import org.bukkit.Location;
import org.bukkit.World;

public class BlockPosition {
    
    private final int x;
    private final int y;
    private final int z;
    
    public BlockPosition(int x, int y, int z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    public int getX() {
        return x;
    }
    
    public int getY() {
        return y;
    }
    
    public int getZ() {
        return z;
    }
    
    public BlockPosition offset(int dx, int dy, int dz) {
        return new BlockPosition(x + dx, y + dy, z + dz);
    }
    
    public Location toLocation(World world) {
        return new Location(world, x, y, z);
    }
    
    public int distanceTo(BlockPosition other) {
        int dx = x - other.x;
        int dy = y - other.y;
        int dz = z - other.z;
        return (int) Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    @Override
    public String toString() {
        return "(" + x + ", " + y + ", " + z + ")";
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BlockPosition that = (BlockPosition) o;
        return x == that.x && y == that.y && z == that.z;
    }
    
    @Override
    public int hashCode() {
        int result = x;
        result = 31 * result + y;
        result = 31 * result + z;
        return result;
    }
}

