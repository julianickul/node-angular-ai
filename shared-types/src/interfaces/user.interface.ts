import { UserRole } from '../enums/user-role.enum';

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Интерфейс для создания пользователя (контракт API)
 * Используется фронтом для типизации форм и бэком для маппинга
 */
export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Интерфейс для обновления пользователя (контракт API)
 * Все поля опциональны — можно обновлять частично
 */
export interface IUserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Интерфейс для ответа API (без пароля и timestamps)
 */
export interface IUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}
