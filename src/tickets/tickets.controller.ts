import {
    CACHE_MANAGER,
    Controller,
    Get,
    HttpException,
    Inject,
    Param,
    Post,
    Req,
    Request,
    UseGuards
} from '@nestjs/common';
import {TicketsService} from "./tickets.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {TicketEntity} from "../entites/ticket.entity";
import date from 'date-and-time';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
    constructor(
        private ticketsService: TicketsService,
        @Inject(CACHE_MANAGER)
        private cacheManager
    ) {
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Создание тикета'})
    @ApiBearerAuth()
    @Post('create')
    async create(@Request() req): Promise<TicketEntity[]> {
        if (req.body.subject.length < 4) {
            throw new HttpException('The minimum number of characters in a subject must be: 4', 400);
        }

        if (req.body.problem.length < 4) {
            throw new HttpException('The minimum number of characters in a problem should be: 4', 400);
        }

        const lastTicket = await this.ticketsService.getLastActiveTicketByUserId(req.user.id);

        if (lastTicket) {
            throw new HttpException('Close the previous ticket', 400);
        }

        const messages = [];
        messages.push({
            type: 'user',
            message: req.body.problem,
            created_at: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        });

        const data = {
            user_id: req.user.id,
            subject: req.body.subject,
            game_number: req.body.gameNumber,
            messages: JSON.stringify(messages)
        };

        await this.ticketsService.create(data);

        return await this.ticketsService.getTicketsByUserId(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Получение тикетов пользователя'})
    @ApiBearerAuth()
    @Get('getTickets')
    async getTickets(@Request() req): Promise<TicketEntity[]> {
        return this.ticketsService.getTicketsByUserId(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Получить тикет по id'})
    @ApiBearerAuth()
    @Get('get/:id')
    async getTicket(@Request() req, @Param() params): Promise<TicketEntity> {
        const id = params.id;

        const ticket = await this.ticketsService.getUserTicket(id, req.user.id);

        if (ticket) {
            return ticket;
        } else {
            throw new HttpException('Ticket not found', 400);
        }
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Отправить сообщение в тикет'})
    @ApiBearerAuth()
    @Post('sendMessage')
    async sendMessage(@Request() req): Promise<TicketEntity> {
        const {id, message} = req.body;

        const ticket = await this.ticketsService.getUserTicket(id, req.user.id);

        if (!ticket) {
            throw new HttpException('Ticket not found', 400);
        }

        if (ticket.is_closed) {
            throw new HttpException('Ticket closed', 400);
        }

        if (typeof await this.cacheManager.get(`ticket_${req.user.id}`) !== 'undefined') {
            throw new HttpException('Please, wait...', 400);
        }

        this.cacheManager.set(`ticket_${req.user.id}`, 1, 3);

        const messages = JSON.parse(ticket.messages);
        messages.push({
            type: 'user',
            message: message,
            created_at: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
        })

        ticket.messages = JSON.stringify(messages);
        ticket.last_user = true;
        await this.ticketsService.update(ticket);

        return ticket;
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Закрыть тикет'})
    @ApiBearerAuth()
    @Post('closeTicket')
    async closeTicket(@Request() req): Promise<TicketEntity> {
        const {id} = req.body;

        const ticket = await this.ticketsService.getUserTicket(id, req.user.id);

        if (!ticket) {
            throw new HttpException('Ticket not found', 400);
        }

        if (ticket.is_closed) {
            throw new HttpException('Ticket closed', 400);
        }

        ticket.is_closed = true;
        await this.ticketsService.update(ticket);

        return ticket;
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Удалить тикет'})
    @ApiBearerAuth()
    @Post('deleteTicket')
    async deleteTicket(@Request() req): Promise<any> {
        const {id} = req.body;

        const ticket = await this.ticketsService.getUserTicket(id, req.user.id);

        if (!ticket) {
            throw new HttpException('Ticket not found', 400);
        }

        await this.ticketsService.delete(ticket);

        return {
            success: true
        }
    }
}