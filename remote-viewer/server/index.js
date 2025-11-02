import express from "express";
import http from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();

const publicDir = join(__dirname, "../public");
app.use(express.static(publicDir));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = {
  sender: null,
  viewer: null,
};

function trySend(targetSocket, message, fallback) {
  if (!targetSocket || targetSocket.readyState !== WebSocket.OPEN) {
    if (fallback) {
      fallback();
    }
    return false;
  }
  targetSocket.send(JSON.stringify(message));
  return true;
}

function validateMessage(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Not an object");
    }
    const { type, from, payload } = parsed;
    if (!type || !from) {
      throw new Error("Missing required fields");
    }
    if (!["sender", "viewer"].includes(from)) {
      throw new Error("Invalid role");
    }
    if (!["join", "offer", "answer", "ice", "disconnect"].includes(type)) {
      throw new Error("Unsupported message type");
    }
    return { type, from, payload: payload || {} };
  } catch (error) {
    return { error };
  }
}

function setClient(role, socket) {
  const previousSocket = clients[role];
  if (previousSocket && previousSocket !== socket) {
    try {
      previousSocket.close(4001, "Replaced by a new connection");
    } catch (err) {
      console.warn(`Failed to close previous ${role} connection`, err);
    }
  }
  clients[role] = socket;
  socket.role = role;
}

function counterpartOf(role) {
  return role === "sender" ? "viewer" : "sender";
}

wss.on("connection", (socket) => {
  console.log("WebSocket client connected");

  socket.on("message", (data) => {
    const { type, from, payload, error } = validateMessage(data);
    if (error) {
      console.warn("Invalid message received", error.message);
      trySend(socket, {
        type: "error",
        from: "server",
        payload: { message: error.message },
      });
      return;
    }

    if (type === "join") {
      setClient(from, socket);
      console.log(`${from} joined`);
      trySend(socket, {
        type: "ack",
        from: "server",
        payload: { message: `Joined as ${from}` },
      });

      const partner = counterpartOf(from);
      const partnerSocket = clients[partner];
      if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
        trySend(partnerSocket, {
          type: "partner-ready",
          from: "server",
          payload: { partner },
        });
      }
      return;
    }

    const targetRole = counterpartOf(from);
    const targetSocket = clients[targetRole];

    const forwarded = trySend(targetSocket, { type, from, payload }, () => {
      trySend(socket, {
        type: "error",
        from: "server",
        payload: { message: `${targetRole} not connected` },
      });
    });

    if (forwarded) {
      console.log(`Forwarded ${type} from ${from} to ${targetRole}`);
    }
  });

  socket.on("close", (code, reason) => {
    const role = socket.role;
    console.log(`WebSocket closed ${role ? `(${role})` : ""} code=${code} reason=${reason}`);
    if (role && clients[role] === socket) {
      clients[role] = null;
      const partner = counterpartOf(role);
      const partnerSocket = clients[partner];
      trySend(partnerSocket, {
        type: "partner-disconnected",
        from: "server",
        payload: { partner: role },
      });
    }
  });

  socket.on("error", (err) => {
    console.error("WebSocket error", err);
  });
});

server.listen(PORT, () => {
  console.log(`Remote Viewer signaling server listening on port ${PORT}`);
  console.log(`Serving static files from ${publicDir}`);
});
