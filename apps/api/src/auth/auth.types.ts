import type { Request } from "express";

export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthenticatedRequest extends Request {
  authSessionId: string;
  user: SafeUser;
}

export interface AuthenticationResult {
  expiresAt: Date;
  token: string;
  user: SafeUser;
}
