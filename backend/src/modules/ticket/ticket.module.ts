import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TicketHistoryService } from './ticket-history.service';
import { TicketHistoryController } from './ticket-history.controller';
import { TicketSubscriber } from './ticket.subscriber';
import { Ticket } from './entities/ticket.entity';
import { TicketHistory } from './entities/ticket-history.entity';
import { User } from '@/modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketHistory, User])],
  controllers: [TicketController, TicketHistoryController],
  providers: [TicketService, TicketHistoryService, TicketSubscriber],
})
export class TicketModule {}
