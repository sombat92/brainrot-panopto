package com.brainrot.mcdb.socket;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class ProtocolParser {
    
    private static final Gson gson = new Gson();
    
    /**
     * Parse incoming message
     */
    public static SocketMessage parseMessage(String json) {
        try {
            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            
            SocketMessage message = new SocketMessage();
            message.id = obj.has("id") ? obj.get("id").getAsString() : null;
            message.auth = obj.has("auth") ? obj.get("auth").getAsString() : null;
            message.command = obj.has("command") ? obj.get("command").getAsString() : null;
            
            if (obj.has("data") && obj.get("data").isJsonObject()) {
                JsonObject data = obj.get("data").getAsJsonObject();
                message.key = data.has("key") ? data.get("key").getAsString() : null;
                
                if (data.has("value")) {
                    String valueStr = data.get("value").getAsString();
                    // Decode base64 value
                    message.value = Base64.getDecoder().decode(valueStr);
                }
            }
            
            return message;
            
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid message format: " + e.getMessage());
        }
    }
    
    /**
     * Create success response
     */
    public static String createSuccessResponse(String id, String command, Object data) {
        JsonObject response = new JsonObject();
        response.addProperty("id", id);
        response.addProperty("success", true);
        response.addProperty("command", command);
        response.add("data", gson.toJsonTree(data));
        response.addProperty("error", (String) null);
        response.addProperty("timestamp", System.currentTimeMillis());
        
        return gson.toJson(response);
    }
    
    /**
     * Create error response
     */
    public static String createErrorResponse(String id, String command, String error) {
        JsonObject response = new JsonObject();
        response.addProperty("id", id);
        response.addProperty("success", false);
        response.addProperty("command", command);
        response.add("data", null);
        response.addProperty("error", error);
        response.addProperty("timestamp", System.currentTimeMillis());
        
        return gson.toJson(response);
    }
    
    /**
     * Message container class
     */
    public static class SocketMessage {
        public String id;
        public String auth;
        public String command;
        public String key;
        public byte[] value;
    }
}

