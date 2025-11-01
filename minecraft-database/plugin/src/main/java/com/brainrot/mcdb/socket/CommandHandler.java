package com.brainrot.mcdb.socket;

import com.brainrot.mcdb.MinecraftDBPlugin;
import com.brainrot.mcdb.database.BlockDatabase;
import com.brainrot.mcdb.socket.ProtocolParser.SocketMessage;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class CommandHandler {
    
    private final MinecraftDBPlugin plugin;
    private final BlockDatabase database;
    
    public CommandHandler(MinecraftDBPlugin plugin, BlockDatabase database) {
        this.plugin = plugin;
        this.database = database;
    }
    
    /**
     * Handle incoming command
     */
    public String handleCommand(SocketMessage message) {
        try {
            // Validate message
            if (message.id == null || message.id.isEmpty()) {
                return ProtocolParser.createErrorResponse("unknown", "UNKNOWN", "Missing request ID");
            }
            
            if (message.command == null || message.command.isEmpty()) {
                return ProtocolParser.createErrorResponse(message.id, "UNKNOWN", "Missing command");
            }
            
            String command = message.command.toUpperCase();
            
            // Route to appropriate handler
            switch (command) {
                case "WRITE":
                    return handleWrite(message);
                    
                case "READ":
                    return handleRead(message);
                    
                case "DELETE":
                    return handleDelete(message);
                    
                case "LIST":
                    return handleList(message);
                    
                case "EXISTS":
                    return handleExists(message);
                    
                case "STATS":
                    return handleStats(message);
                    
                default:
                    return ProtocolParser.createErrorResponse(message.id, command, "Unknown command: " + command);
            }
            
        } catch (Exception e) {
            plugin.getLogger().severe("Error handling command: " + e.getMessage());
            e.printStackTrace();
            return ProtocolParser.createErrorResponse(
                message.id != null ? message.id : "unknown",
                message.command != null ? message.command : "UNKNOWN",
                "Internal error: " + e.getMessage()
            );
        }
    }
    
    private String handleWrite(SocketMessage message) {
        try {
            if (message.key == null || message.key.isEmpty()) {
                return ProtocolParser.createErrorResponse(message.id, "WRITE", "Missing key");
            }
            
            if (message.value == null) {
                return ProtocolParser.createErrorResponse(message.id, "WRITE", "Missing value");
            }
            
            // Write to database
            database.write(message.key, message.value);
            
            // Prepare response data
            Map<String, Object> data = new HashMap<>();
            data.put("key", message.key);
            data.put("size", message.value.length);
            data.put("message", "Data written successfully");
            
            return ProtocolParser.createSuccessResponse(message.id, "WRITE", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "WRITE", e.getMessage());
        }
    }
    
    private String handleRead(SocketMessage message) {
        try {
            if (message.key == null || message.key.isEmpty()) {
                return ProtocolParser.createErrorResponse(message.id, "READ", "Missing key");
            }
            
            // Read from database
            byte[] value = database.read(message.key);
            
            // Encode value as base64
            String encodedValue = Base64.getEncoder().encodeToString(value);
            
            // Prepare response data
            Map<String, Object> data = new HashMap<>();
            data.put("key", message.key);
            data.put("value", encodedValue);
            data.put("size", value.length);
            
            return ProtocolParser.createSuccessResponse(message.id, "READ", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "READ", e.getMessage());
        }
    }
    
    private String handleDelete(SocketMessage message) {
        try {
            if (message.key == null || message.key.isEmpty()) {
                return ProtocolParser.createErrorResponse(message.id, "DELETE", "Missing key");
            }
            
            // Delete from database
            database.delete(message.key);
            
            // Prepare response data
            Map<String, Object> data = new HashMap<>();
            data.put("key", message.key);
            data.put("message", "Data deleted successfully");
            
            return ProtocolParser.createSuccessResponse(message.id, "DELETE", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "DELETE", e.getMessage());
        }
    }
    
    private String handleList(SocketMessage message) {
        try {
            // List all keys
            Set<String> keys = database.listKeys();
            
            // Prepare response data
            Map<String, Object> data = new HashMap<>();
            data.put("keys", keys);
            data.put("count", keys.size());
            
            return ProtocolParser.createSuccessResponse(message.id, "LIST", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "LIST", e.getMessage());
        }
    }
    
    private String handleExists(SocketMessage message) {
        try {
            if (message.key == null || message.key.isEmpty()) {
                return ProtocolParser.createErrorResponse(message.id, "EXISTS", "Missing key");
            }
            
            // Check if key exists
            boolean exists = database.exists(message.key);
            
            // Prepare response data
            Map<String, Object> data = new HashMap<>();
            data.put("key", message.key);
            data.put("exists", exists);
            
            return ProtocolParser.createSuccessResponse(message.id, "EXISTS", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "EXISTS", e.getMessage());
        }
    }
    
    private String handleStats(SocketMessage message) {
        try {
            // Get database statistics
            Map<String, Object> data = new HashMap<>();
            data.put("entries", database.getEntryCount());
            data.put("capacity", database.getEstimatedCapacity());
            data.put("used_percent", database.getUsedCapacity());
            data.put("cache_size", database.getCacheSize());
            data.put("chunks", plugin.getChunkManager().getLoadedChunkCount());
            
            return ProtocolParser.createSuccessResponse(message.id, "STATS", data);
            
        } catch (Exception e) {
            return ProtocolParser.createErrorResponse(message.id, "STATS", e.getMessage());
        }
    }
}

