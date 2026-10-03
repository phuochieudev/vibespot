import type { UserRole } from '@vibespot/shared';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface AuthedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}
