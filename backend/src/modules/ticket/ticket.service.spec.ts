import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TicketService } from './ticket.service';
import { Ticket } from './entities/ticket.entity';
import { User } from '@/modules/users/entities/user.entity';
import { TicketPriority, TicketStatus, UserRole } from '@nnaai/shared-types';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth-request.interface';

describe('TicketService', () => {
  let service: TicketService;
  let ticketRepository: jest.Mocked<
    Pick<Repository<Ticket>, 'createQueryBuilder' | 'findOne' | 'create' | 'save' | 'delete'>
  >;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;

  const staffUser: AuthenticatedUser = {
    id: 1,
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    ticketRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: getRepositoryToken(Ticket), useValue: ticketRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get(TicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns ticket for staff', async () => {
      const ticket = {
        id: 5,
        title: 'Bug',
        authorId: 2,
        assigneeId: null,
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
      } as Ticket;
      ticketRepository.findOne.mockResolvedValue(ticket);

      const result = await service.findOne(5, staffUser);

      expect(result.id).toBe(5);
    });

    it('throws NotFoundException when ticket is missing', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, staffUser)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
