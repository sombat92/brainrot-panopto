const signalingStatusEl = document.getElementById("signalingStatus");
const peerStatusEl = document.getElementById("peerStatus");
const streamStatusEl = document.getElementById("streamStatus");
const remoteVideo = document.getElementById("remoteVideo");
const playButton = document.getElementById("playButton");
const fullscreenButton = document.getElementById("fullscreenButton");

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const SIGNALING_URL = (() => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}`;
})();

let ws;
let reconnectTimer;
let pc;
let remoteStream;
let queuedRemoteIce = [];

const log = (...args) => console.log("[viewer]", ...args);

const setStatus = {
  signaling: (text) => (signalingStatusEl.textContent = text),
  peer: (text) => (peerStatusEl.textContent = text),
  stream: (text) => (streamStatusEl.textContent = text),
};

playButton.addEventListener("click", async () => {
  if (!remoteVideo.srcObject) {
    alert("No stream yet. Ask the sender to start sharing.");
    return;
  }
  try {
    await remoteVideo.play();
    playButton.disabled = true;
    streamStatusEl.textContent = "Playing";
  } catch (error) {
    alert(`Unable to play video: ${error.message}`);
  }
});

fullscreenButton.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    try {
      await remoteVideo.requestFullscreen();
    } catch (error) {
      console.error("Failed to enter fullscreen", error);
    }
  } else {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.error("Failed to exit fullscreen", error);
    }
  }
});

window.addEventListener("beforeunload", () => {
  sendMessage("disconnect", {});
  if (pc) {
    pc.close();
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(1000, "Viewer closing");
  }
});

function connectSignaling() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(SIGNALING_URL);
  } catch (error) {
    console.error("Failed to create WebSocket", error);
    scheduleReconnect();
    return;
  }

  setStatus.signaling("Connecting");

  ws.addEventListener("open", () => {
    log("WebSocket connected");
    clearTimeout(reconnectTimer);
    setStatus.signaling("Connected");
    sendMessage("join", {});
  });

  ws.addEventListener("close", (event) => {
    log(`WebSocket closed code=${event.code} reason=${event.reason}`);
    setStatus.signaling("Disconnected");
    setStatus.peer("Waiting for sender");
    scheduleReconnect();
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error", error);
  });

  ws.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);
      handleSignalingMessage(message);
    } catch (error) {
      console.warn("Invalid signaling message", error);
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) {
    return;
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSignaling();
  }, 2000);
}

async function waitForSignalingReady(timeoutMs = 5000) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }
  if (!ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
    connectSignaling();
  }
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Signaling server not reachable"));
      }
    }, 100);
  });
}

function sendMessage(type, payload = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    waitForSignalingReady().then(() => sendMessage(type, payload)).catch((error) => {
      console.error(`Unable to send ${type}:`, error.message);
    });
    return;
  }
  const message = { type, from: "viewer", payload };
  log("Sending", message);
  ws.send(JSON.stringify(message));
}

async function ensurePeerConnection() {
  if (pc && (pc.connectionState === "closed" || pc.signalingState === "closed")) {
    pc = null;
  }
  if (pc) {
    return pc;
  }

  pc = new RTCPeerConnection(ICE_CONFIG);

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage("ice", { candidate });
    }
  };

  pc.ontrack = (event) => {
    log("Track received", event.track.kind);
    if (!remoteStream) {
      remoteStream = new MediaStream();
    }
    remoteStream.addTrack(event.track);
    if (remoteVideo.srcObject !== remoteStream) {
      remoteVideo.srcObject = remoteStream;
    }
    playButton.disabled = false;
    fullscreenButton.disabled = false;
    setStatus.stream("Ready – click Enable Video");
  };

  pc.oniceconnectionstatechange = () => {
    log("ICE state", pc.iceConnectionState);
    switch (pc.iceConnectionState) {
      case "connected":
      case "completed":
        setStatus.peer("Connected");
        break;
      case "disconnected":
        setStatus.peer("Disconnected – retrying");
        break;
      case "failed":
        setStatus.peer("Failed – awaiting new offer");
        break;
      default:
        break;
    }
  };

  pc.onconnectionstatechange = () => {
    log("Connection state", pc.connectionState);
    if (pc.connectionState === "failed") {
      setStatus.peer("Connection failed – waiting for sender");
    }
  };

  return pc;
}

async function handleOffer(payload) {
  if (!payload?.sdp) {
    console.warn("Offer missing SDP");
    return;
  }

  const peer = await ensurePeerConnection();

  if (peer.signalingState === "have-local-offer") {
    await peer.setLocalDescription({ type: "rollback" });
  }

  await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
  setStatus.peer("Creating answer");

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  sendMessage("answer", { sdp: peer.localDescription });
  setStatus.peer("Answer sent");

  if (queuedRemoteIce.length) {
    const candidates = [...queuedRemoteIce];
    queuedRemoteIce = [];
    for (const candidateInit of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (error) {
        console.error("Failed to add queued ICE candidate", error);
      }
    }
  }
}

async function handleRemoteIce(payload) {
  if (!payload?.candidate) {
    return;
  }
  if (!pc || !pc.remoteDescription) {
    queuedRemoteIce.push(payload.candidate);
    return;
  }
  try {
    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
  } catch (error) {
    console.error("Failed to add ICE candidate", error);
  }
}

function handlePartnerDisconnected(role) {
  setStatus.peer(`Sender ${role === "sender" ? "" : role} disconnected`);
  setStatus.stream("Idle");
  playButton.disabled = true;
  fullscreenButton.disabled = true;
  queuedRemoteIce = [];
  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteStream = null;
  }
  remoteVideo.srcObject = null;
  if (pc) {
    pc.close();
    pc = null;
  }
}

function handleSignalingMessage(message) {
  const { type, payload } = message;
  log("Received", message);
  switch (type) {
    case "ack":
      setStatus.signaling("Ready");
      break;
    case "offer":
      handleOffer(payload).catch((error) => console.error("Failed to handle offer", error));
      break;
    case "ice":
      handleRemoteIce(payload);
      break;
    case "partner-ready":
      setStatus.peer("Sender ready");
      break;
    case "partner-disconnected":
      handlePartnerDisconnected(payload?.partner ?? "sender");
      break;
    case "error":
      console.warn("Server error", payload?.message);
      setStatus.peer(`Error: ${payload?.message ?? "Unknown"}`);
      break;
    default:
      log("Unhandled message type", type);
      break;
  }
}

connectSignaling();
