import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from '@/modules/users/entities/user.entity';
import { TicketPriority, TicketStatus } from '@nnaai/shared-types';
import { PaginatedTicketsResponse } from './interfaces/paginated-tickets.interface';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth-request.interface';
import { isStaffRole } from '@/core/utils/roles.util';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    query: QueryTicketsDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedTicketsResponse> {
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

    if (!isStaffRole(user.role)) {
      queryBuilder.andWhere(
        '(ticket.authorId = :userId OR ticket.assigneeId = :userId)',
        { userId: user.id },
      );
    }

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

  async findOne(id: number, user: AuthenticatedUser): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['author', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }

    this.assertCanView(ticket, user);

    return ticket;
  }

  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }

    if (isStaffRole(user.role)) {
      await this.applyStaffUpdate(ticket, updateTicketDto);
    } else {
      this.applyUserUpdate(ticket, updateTicketDto, user);
    }

    await this.ticketRepository.save(ticket);
    return this.findOne(id, user);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Тикет с ID ${id} не найден`);
    }

    if (!isStaffRole(user.role)) {
      if (ticket.authorId !== user.id) {
        throw new ForbiddenException('Можно удалять только свои заявки');
      }
      if (ticket.status !== TicketStatus.OPEN) {
        throw new ForbiddenException('Можно удалять только заявки со статусом open');
      }
    }

    await this.ticketRepository.delete(id);
  }

  async create(
    createTicketDto: CreateTicketDto,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const isStaff = isStaffRole(user.role);

    let priority = TicketPriority.MEDIUM;
    let assigneeId: number | null = null;

    if (isStaff) {
      if (createTicketDto.priority !== undefined) {
        priority = createTicketDto.priority;
      }

      if (createTicketDto.assigneeId !== undefined) {
        await this.assertAssigneeExists(createTicketDto.assigneeId);
        assigneeId = createTicketDto.assigneeId;
      }
    } else if (
      createTicketDto.priority !== undefined ||
      createTicketDto.assigneeId !== undefined
    ) {
      throw new ForbiddenException(
        'Пользователь не может задавать приоритет или исполнителя при создании',
      );
    }

    const ticket = this.ticketRepository.create({
      title: createTicketDto.title.trim(),
      description: createTicketDto.description.trim(),
      priority,
      status: TicketStatus.OPEN,
      authorId: user.id,
      assigneeId,
    });

    const savedTicket = await this.ticketRepository.save(ticket);
    return this.findOne(savedTicket.id, user);
  }

  private assertCanView(ticket: Ticket, user: AuthenticatedUser): void {
    if (isStaffRole(user.role)) {
      return;
    }

    if (ticket.authorId !== user.id && ticket.assigneeId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой заявке');
    }
  }

  private applyUserUpdate(
    ticket: Ticket,
    dto: UpdateTicketDto,
    user: AuthenticatedUser,
  ): void {
    if (ticket.authorId !== user.id) {
      throw new ForbiddenException('Редактировать можно только свои заявки');
    }

    if (ticket.status !== TicketStatus.OPEN) {
      throw new ForbiddenException(
        'Редактировать можно только заявки со статусом open',
      );
    }

    if (
      dto.status !== undefined ||
      dto.priority !== undefined ||
      dto.assigneeId !== undefined
    ) {
      throw new ForbiddenException(
        'Пользователь не может менять статус, приоритет или исполнителя',
      );
    }

    if (dto.title === undefined && dto.description === undefined) {
      throw new BadRequestException('Нет полей для обновления');
    }

    if (dto.title !== undefined) {
      ticket.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      ticket.description = dto.description.trim();
    }
  }

  private async applyStaffUpdate(
    ticket: Ticket,
    dto: UpdateTicketDto,
  ): Promise<void> {
    if (
      dto.assigneeId !== undefined &&
      dto.assigneeId !== null
    ) {
      await this.assertAssigneeExists(dto.assigneeId);
    }

    let hasChanges = false;

    if (dto.title !== undefined) {
      ticket.title = dto.title.trim();
      hasChanges = true;
    }

    if (dto.description !== undefined) {
      ticket.description = dto.description.trim();
      hasChanges = true;
    }

    if (dto.status !== undefined) {
      ticket.status = dto.status;
      hasChanges = true;
    }

    if (dto.priority !== undefined) {
      ticket.priority = dto.priority;
      hasChanges = true;
    }

    if (dto.assigneeId !== undefined) {
      ticket.assigneeId = dto.assigneeId;
      hasChanges = true;
    }

    if (!hasChanges) {
      throw new BadRequestException('Нет полей для обновления');
    }
  }

  private async assertAssigneeExists(assigneeId: number): Promise<void> {
    const assignee = await this.userRepository.findOne({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException(`Исполнитель с ID ${assigneeId} не найден`);
    }
  }
}
