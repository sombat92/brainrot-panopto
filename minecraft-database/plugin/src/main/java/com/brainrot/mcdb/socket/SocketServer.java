package com.brainrot.mcdb.socket;

import com.brainrot.mcdb.MinecraftDBPlugin;
import com.brainrot.mcdb.database.BlockDatabase;
import com.brainrot.mcdb.socket.ProtocolParser.SocketMessage;
import com.brainrot.mcdb.utils.ConfigManager;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class SocketServer {
    
    private final MinecraftDBPlugin plugin;
    private final ConfigManager config;
    private final CommandHandler commandHandler;
    private final Set<ClientHandler> activeConnections;
    
    private ServerSocket serverSocket;
    private Thread acceptThread;
    private ExecutorService executorService;
    private volatile boolean running;
    
    public SocketServer(MinecraftDBPlugin plugin, BlockDatabase database) {
        this.plugin = plugin;
        this.config = plugin.getConfigManager();
        this.commandHandler = new CommandHandler(plugin, database);
        this.activeConnections = ConcurrentHashMap.newKeySet();
        this.running = false;
    }
    
    /**
     * Start the socket server
     */
    public void start() {
        if (running) {
            plugin.getLogger().warning("Socket server is already running!");
            return;
        }
        
        try {
            int port = config.getSocketPort();
            String host = config.getSocketHost();
            
            serverSocket = new ServerSocket(port);
            serverSocket.setSoTimeout(1000); // 1 second timeout for accept()
            
            executorService = Executors.newFixedThreadPool(config.getMaxConnections());
            
            running = true;
            
            // Start accept thread
            acceptThread = new Thread(this::acceptConnections, "MCDB-Socket-Accept");
            acceptThread.start();
            
            plugin.getLogger().info("Socket server started on " + host + ":" + port);
            
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to start socket server: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Stop the socket server
     */
    public void stop() {
        if (!running) {
            return;
        }
        
        running = false;
        
        try {
            // Close all active connections
            for (ClientHandler handler : activeConnections) {
                handler.close();
            }
            activeConnections.clear();
            
            // Close server socket
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
            
            // Shutdown executor
            if (executorService != null) {
                executorService.shutdown();
                if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                    executorService.shutdownNow();
                }
            }
            
            // Wait for accept thread
            if (acceptThread != null && acceptThread.isAlive()) {
                acceptThread.join(2000);
            }
            
            plugin.getLogger().info("Socket server stopped");
            
        } catch (Exception e) {
            plugin.getLogger().severe("Error stopping socket server: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Check if server is running
     */
    public boolean isRunning() {
        return running;
    }
    
    /**
     * Get number of active connections
     */
    public int getConnectionCount() {
        return activeConnections.size();
    }
    
    /**
     * Accept incoming connections
     */
    private void acceptConnections() {
        plugin.getLogger().info("Socket server accepting connections...");
        
        while (running) {
            try {
                Socket clientSocket = serverSocket.accept();
                
                if (activeConnections.size() >= config.getMaxConnections()) {
                    plugin.getLogger().warning("Max connections reached, rejecting connection from " + 
                        clientSocket.getInetAddress());
                    clientSocket.close();
                    continue;
                }
                
                if (config.logSocketConnections()) {
                    plugin.getLogger().info("New connection from " + clientSocket.getInetAddress());
                }
                
                ClientHandler handler = new ClientHandler(clientSocket);
                activeConnections.add(handler);
                executorService.submit(handler);
                
            } catch (SocketTimeoutException e) {
                // Normal timeout, continue loop
            } catch (IOException e) {
                if (running) {
                    plugin.getLogger().warning("Error accepting connection: " + e.getMessage());
                }
            }
        }
        
        plugin.getLogger().info("Socket server stopped accepting connections");
    }
    
    /**
     * Handle individual client connection
     */
    private class ClientHandler implements Runnable {
        
        private final Socket socket;
        private BufferedReader reader;
        private BufferedWriter writer;
        private boolean authenticated;
        
        public ClientHandler(Socket socket) {
            this.socket = socket;
            this.authenticated = false;
        }
        
        @Override
        public void run() {
            try {
                // Set timeout
                socket.setSoTimeout(config.getTimeoutSeconds() * 1000);
                
                // Setup streams
                reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
                
                // Handle messages
                String line;
                while ((line = reader.readLine()) != null) {
                    handleMessage(line);
                }
                
            } catch (SocketTimeoutException e) {
                if (config.logSocketConnections()) {
                    plugin.getLogger().info("Connection timeout from " + socket.getInetAddress());
                }
            } catch (IOException e) {
                if (config.logSocketConnections()) {
                    plugin.getLogger().warning("Connection error: " + e.getMessage());
                }
            } finally {
                close();
                activeConnections.remove(this);
                
                if (config.logSocketConnections()) {
                    plugin.getLogger().info("Connection closed from " + socket.getInetAddress() + 
                        " (" + activeConnections.size() + " active)");
                }
            }
        }
        
        private void handleMessage(String messageStr) {
            try {
                // Parse message
                SocketMessage message = ProtocolParser.parseMessage(messageStr);
                
                // Authenticate
                if (!authenticated) {
                    if (message.auth == null || !message.auth.equals(config.getAuthToken())) {
                        String response = ProtocolParser.createErrorResponse(
                            message.id != null ? message.id : "unknown",
                            message.command != null ? message.command : "UNKNOWN",
                            "Authentication failed"
                        );
                        sendResponse(response);
                        close();
                        return;
                    }
                    authenticated = true;
                }
                
                // Handle command
                String response = commandHandler.handleCommand(message);
                sendResponse(response);
                
            } catch (IllegalArgumentException e) {
                String response = ProtocolParser.createErrorResponse("unknown", "PARSE", e.getMessage());
                sendResponse(response);
            } catch (Exception e) {
                plugin.getLogger().severe("Error handling message: " + e.getMessage());
                e.printStackTrace();
                String response = ProtocolParser.createErrorResponse("unknown", "ERROR", 
                    "Internal error: " + e.getMessage());
                sendResponse(response);
            }
        }
        
        private void sendResponse(String response) {
            try {
                writer.write(response);
                writer.newLine();
                writer.flush();
            } catch (IOException e) {
                plugin.getLogger().warning("Error sending response: " + e.getMessage());
            }
        }
        
        public void close() {
            try {
                if (reader != null) reader.close();
                if (writer != null) writer.close();
                if (socket != null && !socket.isClosed()) socket.close();
            } catch (IOException e) {
                // Ignore
            }
        }
    }
}

