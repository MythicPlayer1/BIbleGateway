"use client";

import type { Peer, DataConnection, MediaConnection } from "peerjs";
import type {
  RemoteOperatorSession, RemoteCommandPayload, RemoteCommandAck,
  CanonicalPresentationState, PairingRequestMessage, PairingResponseMessage,
  RemoteCommandType, OperatorRole
} from "@/lib/remoteControl";
import { generateUniqueId } from "@/lib/remoteControl";

export const BROADCAST_PEER_PREFIX = "worship-stream-";

export interface ConnectedClientInfo {
  peerId: string;
  connectedAt: number;
  label: string;
  isOperator?: boolean;
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
 * Manages WebRTC PeerJS host for a specific Room Code.
 * - Broadcasts live presentation updates to projector/broadcast display screens.
 * - Manages authenticated Remote Operators, validates pairing tokens, and executes remote commands.
 * - Streams live screen share with full system audio from Host or Mobile Operators directly to projectors.
 */
export class HostBroadcaster {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private operatorSessions: Map<string, { conn: DataConnection; session: RemoteOperatorSession }> = new Map();
  private activeScreenCalls: Map<string, MediaConnection> = new Map();
  private activeScreenStream: MediaStream | null = null;
  private processedRequestIds: Set<string> = new Set();
  private roomCode: string;
  private onClientsChange?: (clients: ConnectedClientInfo[]) => void;
  private onMessageReceived?: (msg: BroadcastMessage, conn: DataConnection) => void;
  private onOperatorPairingRequest?: (req: PairingRequestMessage, conn: DataConnection) => void;
  private onOperatorCommand?: (cmd: RemoteCommandPayload, session: RemoteOperatorSession) => Promise<{ success: boolean; reason?: string }>;
  private onOperatorsChange?: (operators: RemoteOperatorSession[]) => void;
  private onIncomingScreenShare?: (stream: MediaStream, senderId: string) => void;
  private onScreenShareEnded?: () => void;
  private onError?: (err: { type: string; message: string }) => void;
  private onReady?: () => void;
  private onStatusChange?: (status: 'ready' | 'error' | 'disconnected') => void;
  private isDestroyed = false;
  private retryTimer: any = null;
  private retryAttempts = 0;
  private maxRetries = 5;
  private beforeUnloadHandler: (() => void) | null = null;

  public get isReady(): boolean {
    return !this.isDestroyed && !!this.peer && !this.peer.disconnected && !this.peer.destroyed;
  }

  constructor(
    roomCode: string,
    callbacks?: {
      onClientsChange?: (clients: ConnectedClientInfo[]) => void;
      onMessageReceived?: (msg: BroadcastMessage, conn: DataConnection) => void;
      onOperatorPairingRequest?: (req: PairingRequestMessage, conn: DataConnection) => void;
      onOperatorCommand?: (cmd: RemoteCommandPayload, session: RemoteOperatorSession) => Promise<{ success: boolean; reason?: string }>;
      onOperatorsChange?: (operators: RemoteOperatorSession[]) => void;
      onIncomingScreenShare?: (stream: MediaStream, senderId: string) => void;
      onScreenShareEnded?: () => void;
      onError?: (err: { type: string; message: string }) => void;
      onReady?: () => void;
      onStatusChange?: (status: 'ready' | 'error' | 'disconnected') => void;
    }
  ) {
    this.roomCode = roomCode;
    this.onClientsChange = callbacks?.onClientsChange;
    this.onMessageReceived = callbacks?.onMessageReceived;
    this.onOperatorPairingRequest = callbacks?.onOperatorPairingRequest;
    this.onOperatorCommand = callbacks?.onOperatorCommand;
    this.onOperatorsChange = callbacks?.onOperatorsChange;
    this.onIncomingScreenShare = callbacks?.onIncomingScreenShare;
    this.onScreenShareEnded = callbacks?.onScreenShareEnded;
    this.onError = callbacks?.onError;
    this.onReady = callbacks?.onReady;
    this.onStatusChange = callbacks?.onStatusChange;
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

      if (this.peer) {
        try {
          this.peer.destroy();
        } catch {}
        this.peer = null;
      }

      this.peer = new Peer(hostPeerId, {
        debug: 0,
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
        this.onStatusChange?.('ready');
      });

      this.peer.on("connection", (conn) => {
        this.handleNewConnection(conn);
      });

      this.peer.on("call", (mediaCall: MediaConnection) => {
        mediaCall.answer(); // Answer incoming screen share call from mobile remote
        mediaCall.on("stream", (remoteStream: MediaStream) => {
          this.activeScreenStream = remoteStream;
          this.onIncomingScreenShare?.(remoteStream, mediaCall.peer);
          // Forward stream to all other connected clients (like projectors)
          this.connections.forEach((conn, peerId) => {
            if (peerId !== mediaCall.peer && this.peer) {
              try {
                const forwardCall = this.peer.call(peerId, remoteStream);
                if (forwardCall) this.activeScreenCalls.set(peerId, forwardCall);
              } catch {}
            }
          });
          this.broadcast({
            type: "SCREEN_SHARE_START",
            hasAudio: remoteStream.getAudioTracks().length > 0,
            senderPeerId: mediaCall.peer
          });
        });

        mediaCall.on("close", () => {
          this.activeScreenStream = null;
          this.activeScreenCalls.forEach(call => {
            try { call.close(); } catch {}
          });
          this.activeScreenCalls.clear();
          this.onScreenShareEnded?.();
          this.broadcast({ type: "SCREEN_SHARE_STOP" });
        });
      });

      this.peer.on("error", (err: any) => {
        this.onStatusChange?.('error');
        if (err?.type === "unavailable-id") {
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
        this.onStatusChange?.('disconnected');
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

    conn.on("data", async (data: any) => {
      if (typeof data !== "object" || data === null) return;

      const msg = data as BroadcastMessage;

      // Handle Real-Time PING/PONG Heartbeat for live round-trip latency
      if (msg.type === "PING") {
        try {
          conn.send({
            type: "PONG",
            timestamp: msg.timestamp,
            hostTime: Date.now()
          });
        } catch {}
        return;
      }

      // Handle Remote Operator Pairing Request
      if (msg.type === "PAIRING_REQUEST") {
        const req = msg as unknown as PairingRequestMessage;
        this.onOperatorPairingRequest?.(req, conn);
        return;
      }

      // Handle Remote Operator Command
      if (msg.type === "REMOTE_COMMAND") {
        const cmd = msg.payload as RemoteCommandPayload;
        const sessionEntry = this.operatorSessions.get(cmd.operatorId);

        if (!sessionEntry || !sessionEntry.session.isApproved) {
          conn.send({
            type: "COMMAND_ACK",
            requestId: cmd.requestId,
            success: false,
            reason: "UNAUTHORIZED_OR_NOT_APPROVED",
            timestamp: Date.now()
          } as RemoteCommandAck);
          return;
        }

        // Deduplication
        if (this.processedRequestIds.has(cmd.requestId)) {
          conn.send({
            type: "COMMAND_ACK",
            requestId: cmd.requestId,
            success: true,
            reason: "DUPLICATE_IGNORED",
            timestamp: Date.now()
          } as RemoteCommandAck);
          return;
        }

        this.processedRequestIds.add(cmd.requestId);
        // Clean up requestId cache if too large
        if (this.processedRequestIds.size > 200) {
          const first = this.processedRequestIds.values().next().value;
          if (first) this.processedRequestIds.delete(first);
        }

        sessionEntry.session.lastActiveAt = Date.now();

        if (this.onOperatorCommand) {
          try {
            const res = await this.onOperatorCommand(cmd, sessionEntry.session);
            conn.send({
              type: "COMMAND_ACK",
              requestId: cmd.requestId,
              success: res.success,
              reason: res.reason,
              timestamp: Date.now()
            } as RemoteCommandAck);
          } catch (e: any) {
            conn.send({
              type: "COMMAND_ACK",
              requestId: cmd.requestId,
              success: false,
              reason: e?.message || "COMMAND_FAILED",
              timestamp: Date.now()
            } as RemoteCommandAck);
          }
        }
        return;
      }

      this.onMessageReceived?.(msg, conn);
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      // Remove any operator bound to this peer
      let foundOpId: string | null = null;
      this.operatorSessions.forEach((entry, opId) => {
        if (entry.conn.peer === conn.peer) {
          foundOpId = opId;
        }
      });
      if (foundOpId) {
        this.operatorSessions.delete(foundOpId);
        this.notifyOperators();
      }
      this.notifyClients();
    });

    conn.on("error", () => {
      this.connections.delete(conn.peer);
      this.notifyClients();
    });
  }

  public registerOperatorSession(session: RemoteOperatorSession, conn: DataConnection) {
    this.operatorSessions.set(session.operatorId, { conn, session });
    this.notifyOperators();
  }

  public removeOperatorSession(operatorId: string, reason: string = "REVOKED") {
    const entry = this.operatorSessions.get(operatorId);
    if (entry) {
      try {
        entry.conn.send({
          type: "PAIRING_RESPONSE",
          status: "revoked",
          role: "viewer",
          operatorId,
          sessionId: "",
          hasControlLock: false,
          roomCode: this.roomCode,
          reason
        } as PairingResponseMessage);
      } catch {}
      this.operatorSessions.delete(operatorId);
      this.notifyOperators();
    }
  }

  public revokeAllOperators() {
    this.operatorSessions.forEach((entry, opId) => {
      try {
        entry.conn.send({
          type: "PAIRING_RESPONSE",
          status: "revoked",
          role: "viewer",
          operatorId: opId,
          sessionId: "",
          hasControlLock: false,
          roomCode: this.roomCode,
          reason: "ALL_SESSIONS_REVOKED"
        } as PairingResponseMessage);
      } catch {}
    });
    this.operatorSessions.clear();
    this.notifyOperators();
  }

  public updateOperatorRole(operatorId: string, newRole: OperatorRole) {
    const entry = this.operatorSessions.get(operatorId);
    if (entry) {
      entry.session.role = newRole;
      try {
        entry.conn.send({
          type: "PAIRING_RESPONSE",
          status: "approved",
          role: newRole,
          operatorId,
          sessionId: entry.session.operatorId,
          hasControlLock: entry.session.hasControlLock,
          roomCode: this.roomCode
        } as PairingResponseMessage);
      } catch {}
      this.notifyOperators();
    }
  }

  public setControlLock(activeOperatorId: string | null) {
    this.operatorSessions.forEach((entry, opId) => {
      entry.session.hasControlLock = opId === activeOperatorId;
      try {
        entry.conn.send({
          type: "CONTROL_LOCK_CHANGE",
          activeControllerId: activeOperatorId,
          hasControlLock: entry.session.hasControlLock
        });
      } catch {}
    });
    this.notifyOperators();
  }

  public broadcastCanonicalState(state: CanonicalPresentationState) {
    // Send full canonical state update to all paired operator clients
    this.operatorSessions.forEach((entry) => {
      if (entry.conn.open) {
        try {
          entry.conn.send({
            type: "CANONICAL_STATE_UPDATE",
            state
          });
        } catch {}
      }
    });
  }

  private notifyClients() {
    const clients: ConnectedClientInfo[] = [];
    let idx = 1;
    this.connections.forEach((conn) => {
      let isOp = false;
      this.operatorSessions.forEach((entry) => {
        if (entry.conn.peer === conn.peer) isOp = true;
      });
      clients.push({
        peerId: conn.peer,
        connectedAt: Date.now(),
        label: isOp ? `Remote Operator #${idx++}` : `Remote Display #${idx++}`,
        isOperator: isOp
      });
    });
    this.onClientsChange?.(clients);
  }

  public getConnectedOperators(): RemoteOperatorSession[] {
    const list: RemoteOperatorSession[] = [];
    this.operatorSessions.forEach((entry) => {
      list.push(entry.session);
    });
    return list;
  }

  public hasActiveOperator(excludeOperatorId?: string): boolean {
    for (const [opId, entry] of this.operatorSessions.entries()) {
      if (excludeOperatorId && opId === excludeOperatorId) continue;
      if (entry.session.isApproved && entry.session.role !== 'viewer') {
        return true;
      }
    }
    return false;
  }

  private notifyOperators() {
    const list = this.getConnectedOperators();
    this.onOperatorsChange?.(list);
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

  public broadcastScreenShare(stream: MediaStream) {
    this.activeScreenStream = stream;
    this.connections.forEach((conn, peerId) => {
      if (this.peer) {
        try {
          const call = this.peer.call(peerId, stream);
          if (call) this.activeScreenCalls.set(peerId, call);
        } catch {}
      }
    });
    this.broadcast({
      type: "SCREEN_SHARE_START",
      hasAudio: stream.getAudioTracks().length > 0,
      senderPeerId: "host"
    });
  }

  public stopScreenShare() {
    this.activeScreenStream = null;
    this.activeScreenCalls.forEach(call => {
      try { call.close(); } catch {}
    });
    this.activeScreenCalls.clear();
    this.broadcast({ type: "SCREEN_SHARE_STOP" });
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
    this.operatorSessions.clear();
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
 * Connects to a Host Broadcaster room over WebRTC and receives live slide updates (for /projector).
 */
export class ClientReceiver {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private activeScreenCall: MediaConnection | null = null;
  private roomCode: string;
  private onMessage: (msg: BroadcastMessage) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
  private onScreenShareStream?: (stream: MediaStream) => void;
  private onScreenShareEnded?: () => void;
  private isDestroyed = false;
  private reconnectTimer: any = null;
  private connectAttempts = 0;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(
    roomCode: string,
    callbacks: {
      onMessage: (msg: BroadcastMessage) => void;
      onStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
      onScreenShareStream?: (stream: MediaStream) => void;
      onScreenShareEnded?: () => void;
    }
  ) {
    this.roomCode = roomCode;
    this.onMessage = callbacks.onMessage;
    this.onStatusChange = callbacks.onStatusChange;
    this.onScreenShareStream = callbacks.onScreenShareStream;
    this.onScreenShareEnded = callbacks.onScreenShareEnded;
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

      this.peer = new Peer({
        debug: 0,
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

      this.peer.on("call", (mediaCall: MediaConnection) => {
        mediaCall.answer(); // Answer incoming screen share call from host
        this.activeScreenCall = mediaCall;
        mediaCall.on("stream", (stream: MediaStream) => {
          this.onScreenShareStream?.(stream);
        });
        mediaCall.on("close", () => {
          this.activeScreenCall = null;
          this.onScreenShareEnded?.();
        });
      });

      this.peer.on("error", () => {
        this.onStatusChange("disconnected");
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
        try {
          conn.send({ type: "REQUEST_INIT_STATE" });
        } catch {}
      });

      conn.on("data", (data: any) => {
        if (typeof data === "object" && data !== null) {
          if (data.type === "SCREEN_SHARE_STOP") {
            this.onScreenShareEnded?.();
          }
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

/**
 * Remote Operator Client Class
 * Connects mobile operator PWA (/remote) to Desktop Host over WebRTC.
 * Supports token pairing, command execution with ACK promises, and canonical state synchronization.
 */
export class RemoteOperatorClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private activeScreenCall: MediaConnection | null = null;
  private localScreenStream: MediaStream | null = null;
  private roomCode: string;
  private operatorId: string;
  private operatorName: string;
  private pairingToken: string;
  private onCanonicalState: (state: CanonicalPresentationState) => void;
  private onPairingStatus: (resp: PairingResponseMessage) => void;
  private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'pending' | 'paired' | 'revoked') => void;
  private onControlLockChange?: (hasLock: boolean, activeControllerId: string | null) => void;
  private onErrorMessage?: (msg: string) => void;
  private onPing?: (pingMs: number) => void;
  private pendingCommandAcks: Map<string, { resolve: (ack: RemoteCommandAck) => void; reject: (err: any) => void; timer: any }> = new Map();
  private isDestroyed = false;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private connectAttempts = 0;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(
    roomCode: string,
    operatorId: string,
    operatorName: string,
    pairingToken: string,
    callbacks: {
      onCanonicalState: (state: CanonicalPresentationState) => void;
      onPairingStatus: (resp: PairingResponseMessage) => void;
      onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'pending' | 'paired' | 'revoked') => void;
      onControlLockChange?: (hasLock: boolean, activeControllerId: string | null) => void;
      onErrorMessage?: (msg: string) => void;
      onPing?: (pingMs: number) => void;
    }
  ) {
    this.roomCode = roomCode;
    this.operatorId = operatorId;
    this.operatorName = operatorName;
    this.pairingToken = pairingToken;
    this.onCanonicalState = callbacks.onCanonicalState;
    this.onPairingStatus = callbacks.onPairingStatus;
    this.onStatusChange = callbacks.onStatusChange;
    this.onControlLockChange = callbacks.onControlLockChange;
    this.onErrorMessage = callbacks.onErrorMessage;
    this.onPing = callbacks.onPing;
    this.init();

    if (typeof window !== "undefined") {
      this.beforeUnloadHandler = () => {
        this.destroy();
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  public get isConnected(): boolean {
    return !this.isDestroyed && !!this.conn && this.conn.open;
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

      this.peer = new Peer({
        debug: 0,
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
        if (err?.type === "peer-unavailable") {
          this.onErrorMessage?.(`Room "${this.roomCode}" not found on signaling server. Make sure Desktop broadcast is active.`);
        } else {
          this.onErrorMessage?.(err?.message || "Connection error occurred.");
        }
        this.onStatusChange("disconnected");
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
        this.startPingHeartbeat();
        // Dispatch Pairing Request
        const deviceInfo = typeof navigator !== "undefined" 
          ? `${navigator.platform || "Mobile"} (${navigator.userAgent.slice(0, 40)})`
          : "Mobile Client";

        const pairMsg: PairingRequestMessage = {
          type: "PAIRING_REQUEST",
          operatorId: this.operatorId,
          name: this.operatorName,
          deviceInfo,
          token: this.pairingToken,
          timestamp: Date.now()
        };
        conn.send(pairMsg);
      });

      conn.on("data", (data: any) => {
        if (typeof data !== "object" || data === null) return;

        // Pairing Response
        if (data.type === "PAIRING_RESPONSE") {
          const resp = data as PairingResponseMessage;
          this.onPairingStatus(resp);
          if (resp.status === "approved") {
            this.onStatusChange("paired");
          } else if (resp.status === "pending") {
            this.onStatusChange("pending");
          } else if (resp.status === "revoked" || resp.status === "denied" || resp.status === "expired") {
            this.onStatusChange("revoked");
          }
          return;
        }

        // Canonical State Update from Host
        if (data.type === "CANONICAL_STATE_UPDATE" && data.state) {
          this.onCanonicalState(data.state as CanonicalPresentationState);
          return;
        }

        // Control Lock Change
        if (data.type === "CONTROL_LOCK_CHANGE") {
          this.onControlLockChange?.(!!data.hasControlLock, data.activeControllerId || null);
          return;
        }

        // Handle PONG response from host for live accurate round-trip ping
        if (data.type === "PONG") {
          const sentTime = typeof data.timestamp === "number" ? data.timestamp : Date.now();
          const rtt = Math.max(1, Math.min(9999, Date.now() - sentTime));
          this.onPing?.(rtt);
          return;
        }

        // Command ACK
        if (data.type === "COMMAND_ACK") {
          const ack = data as RemoteCommandAck;
          const pending = this.pendingCommandAcks.get(ack.requestId);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingCommandAcks.delete(ack.requestId);
            pending.resolve(ack);
          }
          return;
        }
      });

      conn.on("close", () => {
        this.stopPingHeartbeat();
        this.onStatusChange("disconnected");
        this.scheduleReconnect();
      });

      conn.on("error", (err: any) => {
        this.stopPingHeartbeat();
        this.onErrorMessage?.(err?.message || "Channel error");
        this.onStatusChange("disconnected");
        this.scheduleReconnect();
      });
    } catch (e: any) {
      this.onErrorMessage?.(e?.message || "Failed to connect to host");
      this.onStatusChange("disconnected");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;
    this.connectAttempts++;
    const delay = Math.min(4000, 1200 + this.connectAttempts * 600);
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

  /**
   * Execute a remote command with unique requestId and await host ACK
   */
  public sendCommand(type: RemoteCommandType, params?: any): Promise<RemoteCommandAck> {
    return new Promise((resolve, reject) => {
      if (!this.conn || !this.conn.open) {
        reject(new Error("Not connected to Proclaim Host"));
        return;
      }

      const requestId = generateUniqueId("cmd");
      const payload: RemoteCommandPayload = {
        type,
        requestId,
        operatorId: this.operatorId,
        timestamp: Date.now(),
        params
      };

      const timer = setTimeout(() => {
        this.pendingCommandAcks.delete(requestId);
        reject(new Error("Command timed out waiting for host response"));
      }, 4000);

      this.pendingCommandAcks.set(requestId, { resolve, reject, timer });

      try {
        this.conn.send({
          type: "REMOTE_COMMAND",
          payload
        });
      } catch (err) {
        clearTimeout(timer);
        this.pendingCommandAcks.delete(requestId);
        reject(err);
      }
    });
  }

  public updateCredentials(name: string, token: string, newRoomCode?: string) {
    this.operatorName = name;
    this.pairingToken = token;
    if (newRoomCode && newRoomCode !== this.roomCode) {
      this.roomCode = newRoomCode;
    }
    this.onStatusChange("connecting");
    if (this.peer && !this.peer.destroyed && !this.peer.disconnected) {
      this.connectToHost();
    } else {
      this.init();
    }
  }

  public send(payload: any) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload);
      } catch {}
    }
  }

  public get isScreenSharing(): boolean {
    return !!this.localScreenStream && this.localScreenStream.active;
  }

  public async startScreenShare(): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      return { 
        success: false, 
        error: "Screen sharing is not supported by your browser or requires HTTPS / localhost." 
      };
    }
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        surfaceSwitching: "exclude",
        selfBrowserSurface: "exclude",
        systemAudio: "include"
      });

      this.localScreenStream = stream;

      const hostPeerId = formatRoomPeerId(this.roomCode);
      if (this.peer) {
        try {
          const call = this.peer.call(hostPeerId, stream);
          this.activeScreenCall = call || null;
        } catch {}
      }

      if (stream.getVideoTracks().length > 0) {
        stream.getVideoTracks()[0].onended = () => {
          this.stopScreenShare();
        };
      }

      this.send({
        type: "OPERATOR_SCREEN_SHARE_START",
        operatorId: this.operatorId,
        hasAudio: stream.getAudioTracks().length > 0
      });

      return { success: true, stream };
    } catch (e: any) {
      return { success: false, error: e?.message || "Screen sharing was cancelled or failed." };
    }
  }

  public stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      this.localScreenStream = null;
    }
    if (this.activeScreenCall) {
      try { this.activeScreenCall.close(); } catch {}
      this.activeScreenCall = null;
    }
    this.send({
      type: "OPERATOR_SCREEN_SHARE_STOP",
      operatorId: this.operatorId
    });
  }

  private startPingHeartbeat() {
    this.stopPingHeartbeat();
    this.sendPing();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 1500);
  }

  private sendPing() {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send({
          type: "PING",
          timestamp: Date.now()
        });
      } catch {}
    }
  }

  private stopPingHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopPingHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.beforeUnloadHandler && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.pendingCommandAcks.forEach((p) => {
      clearTimeout(p.timer);
      p.reject(new Error("Client destroyed"));
    });
    this.pendingCommandAcks.clear();
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
