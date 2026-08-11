import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from '@nnaai/shared-types';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'find' | 'findOne'>>;

  const mockUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    userRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns mapped active users', async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('admin@example.com');
    });
  });

  describe('findOneById', () => {
    it('returns mapped user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneById(1);

      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when user is missing', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
