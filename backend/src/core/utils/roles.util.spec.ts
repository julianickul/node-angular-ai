import { UserRole } from '@nnaai/shared-types';
import { isStaffRole } from './roles.util';

describe('isStaffRole', () => {
  it('returns true for moderator and admin', () => {
    expect(isStaffRole(UserRole.MODERATOR)).toBe(true);
    expect(isStaffRole(UserRole.ADMIN)).toBe(true);
  });

  it('returns false for regular user', () => {
    expect(isStaffRole(UserRole.USER)).toBe(false);
  });
});
