import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

describe('TicketController', () => {
  let controller: TicketController;
  let ticketService: {
    findAll: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    ticketService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [{ provide: TicketService, useValue: ticketService }],
    }).compile();

    controller = module.get(TicketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findOne to TicketService', async () => {
    const user = { id: 1, email: 'a@b.c', role: 'admin' };
    ticketService.findOne.mockResolvedValue({ id: 10 });

    await controller.findOne(10, user as never);

    expect(ticketService.findOne).toHaveBeenCalledWith(10, user);
  });
});
