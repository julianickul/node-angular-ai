import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from '@/modules/users/entities/user.entity';
import { TicketPriority } from '@nnaai/shared-types';
import { PaginatedTicketsResponse } from './interfaces/paginated-tickets.interface';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query: QueryTicketsDto): Promise<PaginatedTicketsResponse> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      priority,
      assigneeId,
      search,
    } = query;

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.author', 'author')
      .leftJoinAndSelect('ticket.assignee', 'assignee');

    if (status !== undefined) {
      queryBuilder.andWhere('ticket.status = :status', { status });
    }

    if (priority !== undefined) {
      queryBuilder.andWhere('ticket.priority = :priority', { priority });
    }

    if (assigneeId !== undefined) {
      queryBuilder.andWhere('ticket.assigneeId = :assigneeId', { assigneeId });
    }

    if (search !== undefined && search.trim() !== '') {
      queryBuilder.andWhere('ticket.title LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    queryBuilder
      .orderBy(`ticket.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['author', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }

    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }

    if (
      updateTicketDto.assigneeId !== undefined &&
      updateTicketDto.assigneeId !== null
    ) {
      const assignee = await this.userRepository.findOne({
        where: { id: updateTicketDto.assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException(
          `Исполнитель с ID ${updateTicketDto.assigneeId} не найден`,
        );
      }
    }

    let hasChanges = false;

    if (updateTicketDto.status !== undefined) {
      ticket.status = updateTicketDto.status;
      hasChanges = true;
    }

    if (updateTicketDto.priority !== undefined) {
      ticket.priority = updateTicketDto.priority;
      hasChanges = true;
    }

    if (updateTicketDto.assigneeId !== undefined) {
      ticket.assigneeId = updateTicketDto.assigneeId;
      hasChanges = true;
    }

    if (hasChanges) {
      await this.ticketRepository.save(ticket);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ticketRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }
  }

  async create(
    createTicketDto: CreateTicketDto,
    authorId: number,
  ): Promise<Ticket> {
    if (createTicketDto.assigneeId !== undefined) {
      const assignee = await this.userRepository.findOne({
        where: { id: createTicketDto.assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException(
          `Исполнитель с ID ${createTicketDto.assigneeId} не найден`,
        );
      }
    }

    const ticket = this.ticketRepository.create({
      title: createTicketDto.title.trim(),
      description: createTicketDto.description.trim(),
      priority: createTicketDto.priority ?? TicketPriority.MEDIUM,
      authorId,
      assigneeId: createTicketDto.assigneeId ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    return this.findOne(savedTicket.id);
  }
}
