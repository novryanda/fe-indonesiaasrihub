export type WhatsappGatewayStatus =
  | "NOT_CREATED"
  | "STOPPED"
  | "STARTING"
  | "SCAN_QR_CODE"
  | "WORKING"
  | "FAILED";

export interface WhatsappGatewayAccount {
  id: string | null;
  pushName: string | null;
  name: string | null;
  shortName: string | null;
  phoneNumber: string | null;
  raw: unknown;
}

export interface WhatsappGatewaySession {
  sessionName: string;
  exists: boolean;
  status: WhatsappGatewayStatus;
  qrAvailable: boolean;
  me: WhatsappGatewayAccount | null;
  updatedAt: string;
}

export interface WhatsappGatewayPairingCode {
  code: string;
}
