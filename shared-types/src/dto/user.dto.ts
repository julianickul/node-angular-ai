export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: UserRole;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}