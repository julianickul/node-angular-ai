import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { AuthToken } from './entities/auth.entity';
import { UserRole } from '@nnaai/shared-types';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'create' | 'save' | 'update'>>;
  let tokensRepo: jest.Mocked<Pick<Repository<AuthToken>, 'findOne' | 'save' | 'delete'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verify'>>;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    passwordHash: 'hashed',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    tokensRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(AuthToken), useValue: tokensRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('creates a user with role USER', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'user@example.com',
        password: 'secret12',
        firstName: 'Ada',
        lastName: 'Lovelace',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          role: UserRole.USER,
        }),
      );
      expect(result.email).toBe('user@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException when email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'secret12',
          firstName: 'Ada',
          lastName: 'Lovelace',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns user and tokens on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepo.update.mockResolvedValue({ affected: 1 } as never);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      tokensRepo.save.mockResolvedValue({} as AuthToken);

      const result = await service.login({
        email: 'user@example.com',
        password: 'secret12',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('user@example.com');
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deletes refresh token when found', async () => {
      tokensRepo.findOne.mockResolvedValue({ id: 10 } as AuthToken);
      tokensRepo.delete.mockResolvedValue({ affected: 1 } as never);

      const result = await service.logout('refresh-token');

      expect(tokensRepo.delete).toHaveBeenCalledWith({ id: 10 });
      expect(result.success).toBe(true);
    });
  });
});
