import {Body, Controller, Get, Param, Post, Query, UseGuards} from "@nestjs/common"
import {TicketsService} from "../tickets/tickets.service"
import {Utils} from "../utils"
import {JwtAuthGuard} from "../auth/jwt-auth.guard"
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard"
import datef from 'datef'

@Controller('admin/tickets')
export class AdminTicketsController {
    constructor(
        private ticketService: TicketsService,
        private utils: Utils
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get()
    async getTickets(@Query() query): Promise<any> {
        const { draw, row, length, columnName, columnSortOrder, searchValue } = await this.utils.parseDataTableQuery(query)

        const tickets = await this.ticketService.getTickets(
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const ticketsAll = await this.ticketService.getCountTickets()

        return {
            draw,
            data: tickets,
            recordsTotal: ticketsAll,
            recordsFiltered: ticketsAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get(':id')
    async getTicket(@Param('id') id): Promise<any> {
        return await this.ticketService.getTicketById(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post(':id/sendMessage')
    async sendMessage(@Param('id') id, @Body() body): Promise<any> {
        const ticket = await this.ticketService.getTicketById(id)

        const messages = JSON.parse(ticket.messages);
        messages.push({
            type: 'admin',
            message: body.message,
            created_at: datef('HH:mm dd.MM.YYYY', new Date())
        })

        ticket.messages = JSON.stringify(messages);
        ticket.last_user = true;
        await this.ticketService.update(ticket);

        return ticket
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post(':id/close')
    async closeTicket(@Param('id') id): Promise<any> {
        const ticket = await this.ticketService.getTicketById(id)

        ticket.is_closed = true

        return await this.ticketService.update(ticket)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post(':id/open')
    async openTicket(@Param('id') id): Promise<any> {
        const ticket = await this.ticketService.getTicketById(id)

        ticket.is_closed = false

        return await this.ticketService.update(ticket)
    }
}