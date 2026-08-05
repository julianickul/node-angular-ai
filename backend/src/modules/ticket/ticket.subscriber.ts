import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { getRequestUser } from '@/core/context/request-context.storage';

@Injectable()
@EventSubscriber()
export class TicketSubscriber implements EntitySubscriberInterface<Ticket> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Ticket;
  }

  async afterUpdate(event: UpdateEvent<Ticket>): Promise<void> {
    const ticket = event.entity;
    const previousTicket = event.databaseEntity;

    if (!ticket?.id || !previousTicket) {
      return;
    }

    const oldStatus = previousTicket.status;
    const newStatus = ticket.status;

    if (oldStatus === newStatus) {
      return;
    }

    const user = getRequestUser();
    const userName = user?.lastName ?? 'Система';

    const message = `Статус изменен с '${oldStatus}' на '${newStatus}' пользователем ${userName}`;

    await event.manager.insert(TicketHistory, {
      ticketId: ticket.id,
      message,
      changedById: user?.id ?? null,
    });
  }
}
