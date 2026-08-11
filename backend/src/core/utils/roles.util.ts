import { UserRole } from '@nnaai/shared-types';

export function isStaffRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MODERATOR;
}
