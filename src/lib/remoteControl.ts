import type { 
  ScheduleItem, SongSlide, GlobalBackgroundConfig, TickerConfig, 
  TextAnimationConfig, ProjectorDisplayConfig 
} from "@/lib/lyrics";

export type OperatorRole = 'viewer' | 'operator' | 'senior_operator' | 'admin';

export interface RemoteOperatorSession {
  operatorId: string;
  name: string;
  deviceInfo: string;
  role: OperatorRole;
  pairedAt: number;
  lastActiveAt: number;
  peerId: string;
  isApproved: boolean;
  hasControlLock: boolean;
}

export type RemoteCommandType =
  | 'PRESENTATION_NEXT'
  | 'PRESENTATION_PREVIOUS'
  | 'PRESENTATION_GO_LIVE'
  | 'PRESENTATION_SELECT_ITEM'
  | 'PRESENTATION_SELECT_SLIDE'
  | 'PRESENTATION_BLACKOUT'
  | 'PRESENTATION_TEXT_MUTE'
  | 'PRESENTATION_TEXT_SHOW'
  | 'COUNTDOWN_START'
  | 'COUNTDOWN_PAUSE'
  | 'COUNTDOWN_RESET'
  | 'COUNTDOWN_ADJUST'
  | 'TICKER_TOGGLE'
  | 'TICKER_SET_TEXT'
  | 'REQUEST_CONTROL_LOCK'
  | 'RELEASE_CONTROL_LOCK'
  | 'REQUEST_ROLE_UPGRADE'
  | 'PING';

export interface RemoteCommandPayload {
  type: RemoteCommandType;
  requestId: string;
  operatorId: string;
  sessionId?: string;
  timestamp: number;
  params?: {
    itemId?: string;
    slideIndex?: number;
    delta?: number;
    seconds?: number;
    tickerText?: string;
    hidden?: boolean;
    [key: string]: any;
  };
}

export interface RemoteCommandAck {
  type: 'COMMAND_ACK';
  requestId: string;
  success: boolean;
  reason?: string;
  revision?: number;
  timestamp: number;
}

export interface CanonicalPresentationState {
  revision: number;
  updatedAt: number;
  // Live Active Slide Content
  activeItemId: string | null;
  activeSlideIndex: number;
  activeItemTitle: string;
  activeSlideText: string;
  activeSlideCitation: string;
  activeSlideSection: string;
  totalSlidesInItem: number;
  // Upcoming / Next preview info
  nextItemTitle: string | null;
  nextSlideText: string | null;
  // Display & Visibility States
  isTextHidden: boolean;
  isBlackout: boolean;
  isDisplayConnected: boolean;
  isBroadcasting: boolean;
  // Timer & Ticker
  countdownLeft: number;
  isCountdownRunning: boolean;
  tickerConfig: TickerConfig;
  // Styling
  globalBgConfig: GlobalBackgroundConfig;
  textAnimConfig: TextAnimationConfig;
  displayConfig: ProjectorDisplayConfig;
  // Full Service Schedule summary for mobile navigator
  scheduleItems: Array<{
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    slideCount: number;
    slides: Array<{
      section: string;
      lines: string[];
      text: string;
      title?: string;
    }>;
  }>;
  // Control Lock Info
  activeControllerId: string | null;
  activeControllerName: string | null;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  operatorName: string;
  operatorRole: OperatorRole;
  action: string;
  details?: string;
  type: 'navigation' | 'control' | 'connection' | 'security' | 'schedule';
}

export interface PairingRequestMessage {
  type: 'PAIRING_REQUEST';
  operatorId: string;
  name: string;
  deviceInfo: string;
  token: string;
  requestedRole?: OperatorRole;
  timestamp: number;
}

export interface PairingResponseMessage {
  type: 'PAIRING_RESPONSE';
  status: 'approved' | 'denied' | 'pending' | 'expired' | 'revoked';
  role: OperatorRole;
  operatorId: string;
  sessionId: string;
  hasControlLock: boolean;
  roomCode: string;
  churchName?: string;
  reason?: string;
}

/**
 * Helper to generate secure random temporary pairing tokens
 */
export function generatePairingToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a unique ID
 */
export function generateUniqueId(prefix: string = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Role Permission Check Matrix
 */
export const ROLE_PERMISSIONS = {
  viewer: {
    canControlSlides: false,
    canBlackout: false,
    canControlTimer: false,
    canControlTicker: false,
    canRequestControlLock: false,
    canEditSchedule: false,
    canManageOperators: false,
  },
  operator: {
    canControlSlides: true,
    canBlackout: true,
    canControlTimer: true,
    canControlTicker: true,
    canRequestControlLock: true,
    canEditSchedule: false,
    canManageOperators: false,
  },
  senior_operator: {
    canControlSlides: true,
    canBlackout: true,
    canControlTimer: true,
    canControlTicker: true,
    canRequestControlLock: true,
    canEditSchedule: true,
    canManageOperators: false,
  },
  admin: {
    canControlSlides: true,
    canBlackout: true,
    canControlTimer: true,
    canControlTicker: true,
    canRequestControlLock: true,
    canEditSchedule: true,
    canManageOperators: true,
  },
};
