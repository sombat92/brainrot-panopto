const signalingStatusEl = document.getElementById("signalingStatus");
const peerStatusEl = document.getElementById("peerStatus");
const streamStatusEl = document.getElementById("streamStatus");
const startButton = document.getElementById("startButton");
const previewVideo = document.getElementById("preview");

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
let localStream;
let awaitingViewer = false;
let queuedRemoteCandidates = [];

const log = (...args) => console.log("[sender]", ...args);

const setStatus = {
  signaling: (text) => (signalingStatusEl.textContent = text),
  peer: (text) => (peerStatusEl.textContent = text),
  stream: (text) => (streamStatusEl.textContent = text),
};

startButton.addEventListener("click", () => {
  startShare().catch((error) => {
    console.error("Failed to start sharing", error);
    alert(`Unable to start screen sharing: ${error.message}`);
    startButton.disabled = false;
    setStatus.stream("Error");
  });
});

window.addEventListener("beforeunload", () => {
  sendMessage("disconnect", {});
  if (pc) {
    pc.close();
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(1000, "Sender closing page");
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
    if (pc && pc.iceConnectionState !== "connected") {
      log("Reconnected signaling; renegotiating offer");
      renegotiate({ iceRestart: true }).catch((err) => console.error("Renegotiation failed", err));
    }
  });

  ws.addEventListener("close", (event) => {
    log(`WebSocket closed code=${event.code} reason=${event.reason}`);
    setStatus.signaling("Disconnected");
    setStatus.peer("Waiting for viewer");
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
    log(`Queueing message ${type} until signaling ready`);
    waitForSignalingReady().then(() => sendMessage(type, payload)).catch((error) => {
      console.error(`Unable to send ${type}:`, error.message);
    });
    return;
  }
  const message = { type, from: "sender", payload };
  log("Sending", message);
  ws.send(JSON.stringify(message));
}

async function startShare() {
  startButton.disabled = true;
  setStatus.stream("Requesting screen");
  setStatus.peer("Waiting for viewer");

  await waitForSignalingReady();

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: true,
    });
  } catch (error) {
    startButton.disabled = false;
    setStatus.stream("Permission denied");
    throw error;
  }

  setStatus.stream("Captured");
  previewVideo.srcObject = localStream;
  await createPeerConnection();
  awaitingViewer = true;
  await renegotiate();
}

async function createPeerConnection() {
  if (pc) {
    pc.close();
  }

  pc = new RTCPeerConnection(ICE_CONFIG);

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage("ice", { candidate });
    } else {
      log("All ICE candidates have been sent");
    }
  };

  pc.oniceconnectionstatechange = () => {
    log("ICE state", pc.iceConnectionState);
    switch (pc.iceConnectionState) {
      case "connected":
      case "completed":
        setStatus.peer("Connected");
        awaitingViewer = false;
        break;
      case "disconnected":
        setStatus.peer("Disconnected – retrying");
        break;
      case "failed":
        setStatus.peer("Failed – restarting ICE");
        renegotiate({ iceRestart: true }).catch((error) => console.error("ICE restart failed", error));
        break;
      default:
        break;
    }
  };

  pc.onconnectionstatechange = () => {
    log("Connection state", pc.connectionState);
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      setStatus.peer("Reconnecting");
      renegotiate({ iceRestart: true }).catch((error) => console.error("Renegotiation after failure failed", error));
    }
  };

  pc.onnegotiationneeded = () => {
    log("Negotiation needed event");
    renegotiate().catch((error) => console.error("Negotiationneeded renegotiation failed", error));
  };

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  if (queuedRemoteCandidates.length > 0 && pc.remoteDescription) {
    for (const candidateInit of queuedRemoteCandidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (error) {
        console.error("Failed to add queued ICE candidate", error);
      }
    }
    queuedRemoteCandidates = [];
  }
}

async function renegotiate(options = {}) {
  if (!pc) {
    return;
  }
  try {
    const offer = await pc.createOffer(options);
    await pc.setLocalDescription(offer);
    setStatus.peer("Sending offer");
    sendMessage("offer", { sdp: pc.localDescription });
  } catch (error) {
    console.error("Error creating offer", error);
    setStatus.peer("Offer failed");
    throw error;
  }
}

async function handleAnswer(payload) {
  if (!pc) {
    console.warn("No peer connection for answer");
    return;
  }
  if (!payload?.sdp) {
    console.warn("Answer missing SDP");
    return;
  }
  await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
  setStatus.peer("Viewer connected");
  if (queuedRemoteCandidates.length) {
    const candidates = [...queuedRemoteCandidates];
    queuedRemoteCandidates = [];
    for (const candidateInit of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (error) {
        console.error("Failed to add queued ICE candidate after answer", error);
      }
    }
  }
}

async function handleRemoteIce(payload) {
  if (!payload?.candidate) {
    return;
  }
  const candidateInit = payload.candidate;
  if (!pc || !pc.remoteDescription) {
    log("Queueing remote ICE candidate until ready");
    queuedRemoteCandidates.push(candidateInit);
    return;
  }
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
  } catch (error) {
    console.error("Failed to add ICE candidate", error);
  }
}

function handleSignalingMessage(message) {
  const { type, payload } = message;
  log("Received", message);
  switch (type) {
    case "ack":
      setStatus.signaling("Ready");
      break;
    case "partner-ready":
      setStatus.peer("Viewer ready");
      if (awaitingViewer) {
        renegotiate().catch((error) => console.error("Failed to send offer after viewer ready", error));
      }
      break;
    case "partner-disconnected":
      setStatus.peer("Viewer disconnected");
      awaitingViewer = true;
      break;
    case "answer":
      handleAnswer(payload).catch((error) => console.error("Failed to handle answer", error));
      break;
    case "ice":
      handleRemoteIce(payload);
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
