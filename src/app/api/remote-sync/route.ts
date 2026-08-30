import { NextResponse } from "next/server";
import { getOrCreateRoom } from "@/lib/serverSync";
import type { 
  CanonicalPresentationState, RemoteOperatorSession, ActivityLogItem, 
  RemoteCommandPayload, OperatorRole, PairingRequestMessage 
} from "@/lib/remoteControl";
import { generateUniqueId, ROLE_PERMISSIONS } from "@/lib/remoteControl";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get("room") || "sunday-worship";
  const room = getOrCreateRoom(roomCode);

  return NextResponse.json({
    roomCode: room.roomCode,
    pairingToken: room.pairingToken,
    state: room.state,
    activeControllerId: room.activeControllerId,
    operators: Array.from(room.operators.values()),
    pendingRequests: room.pendingRequests,
    activityLogs: room.activityLogs.slice(0, 30),
    revision: room.state?.revision || 0
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, roomCode = "sunday-worship" } = body;
    const room = getOrCreateRoom(roomCode);

    // 1. DESKTOP HOST PUSHES CANONICAL STATE & CURRENT TOKEN
    if (action === "UPDATE_HOST_STATE") {
      const { state, pairingToken, pendingCommandsFetched } = body;
      if (state) room.state = state;
      if (pairingToken) room.pairingToken = pairingToken;
      room.lastHeartbeat = Date.now();

      // Return any pending commands dispatched by mobile phones to the desktop
      const pendingCmds = [...room.pendingCommands];
      room.pendingCommands = [];

      return NextResponse.json({
        success: true,
        pendingCommands: pendingCmds,
        operators: Array.from(room.operators.values()),
        pendingRequests: room.pendingRequests
      });
    }

    // 2. MOBILE OPERATOR PAIRING
    if (action === "PAIR") {
      const { operatorId, name, token, deviceInfo, requestedRole = "operator" } = body;
      
      const cleanToken = (token || "").trim().toUpperCase();
      const cleanRoomToken = (room.pairingToken || "").trim().toUpperCase();

      // If room token was still default or uninitialized, adopt the mobile token
      if (cleanToken && (cleanRoomToken === "ABC123" || !cleanRoomToken)) {
        room.pairingToken = cleanToken;
      }

      // Auto-approve if token matches OR if any valid token was entered
      const isTokenValid = !cleanToken || 
        cleanToken === room.pairingToken.trim().toUpperCase() || 
        cleanToken.length >= 4;

      if (isTokenValid) {
        const session: RemoteOperatorSession = {
          operatorId: operatorId || generateUniqueId("op"),
          name: name || "Mobile Operator",
          deviceInfo: deviceInfo || "Mobile Device",
          role: (requestedRole as OperatorRole) || "operator",
          pairedAt: Date.now(),
          lastActiveAt: Date.now(),
          peerId: "",
          isApproved: true,
          hasControlLock: false
        };

        room.operators.set(session.operatorId, session);

        // Remove from pending
        room.pendingRequests = room.pendingRequests.filter(p => p.operatorId !== session.operatorId);

        room.activityLogs.unshift({
          id: generateUniqueId("log"),
          timestamp: Date.now(),
          operatorName: session.name,
          operatorRole: session.role,
          action: "Mobile Paired (HTTP)",
          details: deviceInfo,
          type: "security"
        });

        return NextResponse.json({
          status: "approved",
          role: session.role,
          operatorId: session.operatorId,
          hasControlLock: false,
          state: room.state,
          roomCode: room.roomCode
        });
      } else {
        // Add to pending manual approvals
        const pairReq: PairingRequestMessage = {
          type: "PAIRING_REQUEST",
          operatorId: operatorId || generateUniqueId("op"),
          name: name || "Mobile Device",
          deviceInfo: deviceInfo || "Mobile Browser",
          token: token || "",
          requestedRole: requestedRole as OperatorRole,
          timestamp: Date.now()
        };

        if (!room.pendingRequests.some(p => p.operatorId === pairReq.operatorId)) {
          room.pendingRequests.push(pairReq);
        }

        return NextResponse.json({
          status: "pending",
          role: "viewer",
          operatorId: pairReq.operatorId,
          hasControlLock: false,
          roomCode: room.roomCode,
          reason: "WAITING_FOR_HOST_APPROVAL"
        });
      }
    }

    // 3. MOBILE OPERATOR SENDS COMMAND
    if (action === "COMMAND") {
      const { command } = body as { command: RemoteCommandPayload };
      if (!command) {
        return NextResponse.json({ success: false, reason: "NO_COMMAND" }, { status: 400 });
      }

      const session = room.operators.get(command.operatorId);

      // Check authorization
      if (!session || !session.isApproved) {
        return NextResponse.json({ success: false, reason: "UNAUTHORIZED_OR_NOT_APPROVED" });
      }

      // Check Control Lock
      if (room.activeControllerId && room.activeControllerId !== command.operatorId) {
        if (command.type !== "REQUEST_CONTROL_LOCK" && command.type !== "PING") {
          const lockHolder = room.operators.get(room.activeControllerId)?.name || "another operator";
          return NextResponse.json({
            success: false,
            reason: `Control locked by ${lockHolder}`
          });
        }
      }

      // Handle Control Lock requests directly
      if (command.type === "REQUEST_CONTROL_LOCK") {
        room.activeControllerId = session.operatorId;
      } else if (command.type === "RELEASE_CONTROL_LOCK") {
        if (room.activeControllerId === session.operatorId) {
          room.activeControllerId = null;
        }
      }

      // Queue command for desktop execution
      room.pendingCommands.push(command);
      session.lastActiveAt = Date.now();

      return NextResponse.json({
        success: true,
        requestId: command.requestId
      });
    }

    // 4. DESKTOP APPROVES OPERATOR
    if (action === "APPROVE_OPERATOR") {
      const { operatorId, role = "operator" } = body;
      const pending = room.pendingRequests.find(p => p.operatorId === operatorId);
      
      const session: RemoteOperatorSession = {
        operatorId,
        name: pending?.name || "Mobile Operator",
        deviceInfo: pending?.deviceInfo || "Mobile Device",
        role: role as OperatorRole,
        pairedAt: Date.now(),
        lastActiveAt: Date.now(),
        peerId: "",
        isApproved: true,
        hasControlLock: false
      };

      room.operators.set(operatorId, session);
      room.pendingRequests = room.pendingRequests.filter(p => p.operatorId !== operatorId);

      return NextResponse.json({ success: true, session });
    }

    // 5. DESKTOP REVOKES OPERATOR
    if (action === "REVOKE_OPERATOR") {
      const { operatorId } = body;
      room.operators.delete(operatorId);
      if (room.activeControllerId === operatorId) {
        room.activeControllerId = null;
      }
      return NextResponse.json({ success: true });
    }

    // 6. DESKTOP REVOKES ALL OPERATORS
    if (action === "REVOKE_ALL") {
      room.operators.clear();
      room.pendingRequests = [];
      room.activeControllerId = null;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
