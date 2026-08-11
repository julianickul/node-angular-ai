import { UserRole } from '@nnaai/shared-types';

export const ROLE_OPTIONS = Object.values(UserRole);

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: 'Пользователь',
  [UserRole.MODERATOR]: 'Модератор',
  [UserRole.ADMIN]: 'Администратор',
};
