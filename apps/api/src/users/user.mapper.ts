import type { User as UserDto } from '@vibespot/shared';
import type { User } from '../generated/prisma/client.js';

// Không bao giờ trả passwordHash ra ngoài.
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    reputation: user.reputation,
  };
}
