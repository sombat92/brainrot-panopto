package com.brainrot.mcdb.models;

import java.util.Arrays;

public class DataEntry {
    
    private final String key;
    private final byte[] value;
    private final long timestamp;
    private final BlockPosition startPosition;
    
    public DataEntry(String key, byte[] value, BlockPosition startPosition) {
        this.key = key;
        this.value = value;
        this.timestamp = System.currentTimeMillis();
        this.startPosition = startPosition;
    }
    
    public DataEntry(String key, byte[] value, long timestamp, BlockPosition startPosition) {
        this.key = key;
        this.value = value;
        this.timestamp = timestamp;
        this.startPosition = startPosition;
    }
    
    public String getKey() {
        return key;
    }
    
    public byte[] getValue() {
        return value;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public BlockPosition getStartPosition() {
        return startPosition;
    }
    
    public int getSize() {
        return value != null ? value.length : 0;
    }
    
    @Override
    public String toString() {
        return "DataEntry{" +
                "key='" + key + '\'' +
                ", size=" + getSize() +
                ", timestamp=" + timestamp +
                ", position=" + startPosition +
                '}';
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DataEntry dataEntry = (DataEntry) o;
        return key.equals(dataEntry.key);
    }
    
    @Override
    public int hashCode() {
        return key.hashCode();
    }
}

