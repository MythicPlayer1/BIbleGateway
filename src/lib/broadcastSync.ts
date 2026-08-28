"use client";

import type { Peer, DataConnection } from "peerjs";

export const BROADCAST_PEER_PREFIX = "worship-stream-";

export interface ConnectedClientInfo {
  peerId: string;
  connectedAt: number;
  label: string;
}

export type BroadcastMessage = {
  type: string;
  [key: string]: any;
};

/**
 * Format a room name into a safe peer ID
 */
export function formatRoomPeerId(roomCode: string): string {
  const clean = roomCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-");
  return `${BROADCAST_PEER_PREFIX}${clean || "default"}`;
}

/**
 * Host Broadcaster Class
 * Manages the WebRTC PeerJS host for a specific Room Code.
 * Broadcasts all live slide events to all connected remote projector displays.
 */
export class HostBroadcaster {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private roomCode: string;
  private onClientsChange?: (clients: ConnectedClientInfo[]) => void;
  private onMessageReceived?: (msg: BroadcastMessage, conn: DataConnection) => void;
  private onError?: (err: { type: string; message: string }) => void;
  private onReady?: () => void;
  private isDestroyed = false;
  private retryTimer: any = null;
  private retryAttempts = 0;
  private maxRetries = 5;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(
    roomCode: string,
    callbacks?: {
      onClientsChange?: (clients: ConnectedClientInfo[]) => void;
      onMessageReceived?: (msg: BroadcastMessage, conn: DataConnection) => void;
      onError?: (err: { type: string; message: string }) => void;
      onReady?: () => void;
    }
  ) {
    this.roomCode = roomCode;
    this.onClientsChange = callbacks?.onClientsChange;
    this.onMessageReceived = callbacks?.onMessageReceived;
    this.onError = callbacks?.onError;
    this.onReady = callbacks?.onReady;
    this.init();

    if (typeof window !== "undefined") {
      this.beforeUnloadHandler = () => {
        this.destroy();
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  private async init() {
    if (typeof window === "undefined" || this.isDestroyed) return;

    try {
      const { Peer } = await import("peerjs");
      if (this.isDestroyed) return;

      const hostPeerId = formatRoomPeerId(this.roomCode);

      // Clean up previous peer if any
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch {}
        this.peer = null;
      }

      this.peer = new Peer(hostPeerId, {
        debug: 0, // suppress noisy default console abort logs
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", () => {
        this.retryAttempts = 0;
        this.onReady?.();
      });

      this.peer.on("connection", (conn) => {
        this.handleNewConnection(conn);
      });

      this.peer.on("error", (err: any) => {
        if (err?.type === "unavailable-id") {
          // ID was held by previous tab or another instance. Attempt automatic recovery
          if (this.retryAttempts < this.maxRetries && !this.isDestroyed) {
            this.retryAttempts++;
            const delay = 1200 * this.retryAttempts;
            if (this.retryTimer) clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
              if (!this.isDestroyed) {
                this.init();
              }
            }, delay);
            this.onError?.({
              type: "unavailable-id-retrying",
              message: `Room ID is releasing from previous session. Retrying (${this.retryAttempts}/${this.maxRetries})...`
            });
          } else {
            this.onError?.({
              type: "unavailable-id",
              message: `Room ID "${this.roomCode}" is currently active in another tab or by another host. Please choose a different room name.`
            });
          }
        } else {
          this.onError?.({
            type: err?.type || "unknown",
            message: err?.message || "Broadcast connection issue."
          });
        }
      });

      this.peer.on("disconnected", () => {
        if (!this.isDestroyed && this.peer) {
          try {
            this.peer.reconnect();
          } catch {}
        }
      });
    } catch (e: any) {
      this.onError?.({
        type: "init-failed",
        message: e?.message || "Failed to initialize broadcast engine."
      });
    }
  }

  private handleNewConnection(conn: DataConnection) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      this.notifyClients();
    });

    conn.on("data", (data: any) => {
      if (typeof data === "object" && data !== null) {
        this.onMessageReceived?.(data as BroadcastMessage, conn);
      }
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.notifyClients();
    });

    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.notifyClients();
    });
  }

  private notifyClients() {
    const clients: ConnectedClientInfo[] = [];
    let idx = 1;
    this.connections.forEach((conn) => {
      clients.push({
        peerId: conn.peer,
        connectedAt: Date.now(),
        label: `Remote Display #${idx++}`
      });
    });
    this.onClientsChange?.(clients);
  }

  public broadcast(payload: BroadcastMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch {}
      }
    });
  }

  public sendTo(conn: DataConnection, payload: BroadcastMessage) {
    if (conn.open) {
      try {
        conn.send(payload);
      } catch {}
    }
  }

  public getConnectedCount(): number {
    return this.connections.size;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.beforeUnloadHandler && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.connections.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
  }
}

/**
 * Client Receiver Class
 * Connects to a Host Broadcaster room over WebRTC and receives live slide updates.
 */
export class ClientReceiver {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private roomCode: string;
  private onMessage: (msg: BroadcastMessage) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
  private isDestroyed = false;
  private reconnectTimer: any = null;
  private connectAttempts = 0;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(
    roomCode: string,
    callbacks: {
      onMessage: (msg: BroadcastMessage) => void;
      onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
    }
  ) {
    this.roomCode = roomCode;
    this.onMessage = callbacks.onMessage;
    this.onStatusChange = callbacks.onStatusChange;
    this.init();

    if (typeof window !== "undefined") {
      this.beforeUnloadHandler = () => {
        this.destroy();
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  private async init() {
    if (typeof window === "undefined" || this.isDestroyed) return;

    try {
      const { Peer } = await import("peerjs");
      if (this.isDestroyed) return;

      this.onStatusChange("connecting");

      if (this.peer) {
        try {
          this.peer.destroy();
        } catch {}
        this.peer = null;
      }

      // Generate a client peer
      this.peer = new Peer({
        debug: 0, // Suppress console error noise during background negotiation retries
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", () => {
        if (!this.isDestroyed) {
          this.connectToHost();
        }
      });

      this.peer.on("error", (err: any) => {
        this.onStatusChange("disconnected");
        // If peer disconnected or peer unavailable, schedule reconnect
        this.scheduleReconnect();
      });

      this.peer.on("disconnected", () => {
        this.onStatusChange("disconnected");
        if (!this.isDestroyed && this.peer) {
          try {
            this.peer.reconnect();
          } catch {
            this.scheduleReconnect();
          }
        }
      });
    } catch {
      this.onStatusChange("disconnected");
      this.scheduleReconnect();
    }
  }

  private connectToHost() {
    if (!this.peer || this.isDestroyed) return;

    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }

    const hostPeerId = formatRoomPeerId(this.roomCode);

    try {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true
      });

      this.conn = conn;

      conn.on("open", () => {
        this.connectAttempts = 0;
        this.onStatusChange("connected");
        // Request initial snapshot of current live slide
        try {
          conn.send({ type: "REQUEST_INIT_STATE" });
        } catch {}
      });

      conn.on("data", (data: any) => {
        if (typeof data === "object" && data !== null) {
          this.onMessage(data as BroadcastMessage);
        }
      });

      conn.on("close", () => {
        this.onStatusChange("disconnected");
        this.scheduleReconnect();
      });

      conn.on("error", () => {
        this.onStatusChange("disconnected");
        this.scheduleReconnect();
      });
    } catch {
      this.onStatusChange("disconnected");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;
    this.connectAttempts++;
    // Exponential backoff: 2s, 3s, 4s, capped at 5s
    const delay = Math.min(5000, 1500 + this.connectAttempts * 800);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed) {
        if (this.peer && !this.peer.destroyed && !this.peer.disconnected) {
          this.connectToHost();
        } else {
          this.init();
        }
      }
    }, delay);
  }

  public send(payload: BroadcastMessage) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload);
      } catch {}
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.beforeUnloadHandler && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
  }
}
