import { UserRole } from '@nnaai/shared-types';

/**
 * Интерфейс аутентифицированного пользователя
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Расширенный интерфейс Request с добавленным пользователем
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
