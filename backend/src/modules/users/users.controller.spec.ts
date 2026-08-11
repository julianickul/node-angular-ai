import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '@nnaai/shared-types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findAll: jest.Mock;
    findOneById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll to UsersService', async () => {
    usersService.findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('delegates findOne to UsersService', async () => {
    usersService.findOneById.mockResolvedValue({
      id: 1,
      email: 'a@b.c',
      role: UserRole.USER,
    });

    await controller.findOne(1);

    expect(usersService.findOneById).toHaveBeenCalledWith(1);
  });
});
