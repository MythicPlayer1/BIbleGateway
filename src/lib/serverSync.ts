import type {
  CanonicalPresentationState, RemoteOperatorSession, ActivityLogItem,
  RemoteCommandPayload, OperatorRole, PairingRequestMessage
} from "@/lib/remoteControl";

export interface ServerSyncRoom {
  roomCode: string;
  pairingToken: string;
  state: CanonicalPresentationState | null;
  operators: Map<string, RemoteOperatorSession>;
  pendingRequests: PairingRequestMessage[];
  activityLogs: ActivityLogItem[];
  activeControllerId: string | null;
  pendingCommands: RemoteCommandPayload[];
  lastHeartbeat: number;
}

declare global {
  var __proclaim_rooms__: Map<string, ServerSyncRoom> | undefined;
}

if (!globalThis.__proclaim_rooms__) {
  globalThis.__proclaim_rooms__ = new Map<string, ServerSyncRoom>();
}

export function getOrCreateRoom(roomCode: string): ServerSyncRoom {
  const clean = roomCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "sunday-worship";
  const rooms = globalThis.__proclaim_rooms__!;

  if (!rooms.has(clean)) {
    rooms.set(clean, {
      roomCode: clean,
      pairingToken: "ABC123",
      state: null,
      operators: new Map(),
      pendingRequests: [],
      activityLogs: [],
      activeControllerId: null,
      pendingCommands: [],
      lastHeartbeat: Date.now()
    });
  }

  return rooms.get(clean)!;
}
