import { User } from './entities/user.entity';
import { IUser, IUserResponse } from '@nnaai/shared-types';

export class UserMapper {
  static toInterface(user: User): IUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponse(user: User): IUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  static toResponseList(users: User[]): IUserResponse[] {
    return users.map(UserMapper.toResponse);
  }
}
