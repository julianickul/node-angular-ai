import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { PaginatedTicketsResponse } from './interfaces/paginated-tickets.interface';
import { Ticket } from './entities/ticket.entity';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Создать тикет' })
  @ApiResponse({ status: 201, description: 'Тикет создан' })
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser('id') authorId: number,
  ): Promise<Ticket> {
    return this.ticketService.create(createTicketDto, authorId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список тикетов с фильтрацией и пагинацией' })
  @ApiResponse({ status: 200, description: 'Список тикетов' })
  findAll(@Query() query: QueryTicketsDto): Promise<PaginatedTicketsResponse> {
    return this.ticketService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тикет по ID' })
  @ApiResponse({ status: 200, description: 'Детальная карточка тикета' })
  @ApiResponse({ status: 404, description: 'Тикет не найден' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Ticket> {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тикет (статус, приоритет, исполнитель)' })
  @ApiResponse({ status: 200, description: 'Обновлённый тикет' })
  @ApiResponse({ status: 404, description: 'Тикет или исполнитель не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить тикет' })
  @ApiResponse({ status: 204, description: 'Тикет удалён' })
  @ApiResponse({ status: 404, description: 'Тикет не найден' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ticketService.remove(id);
  }
}
