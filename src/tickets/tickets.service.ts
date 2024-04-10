import { Injectable } from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {TicketEntity} from "../entites/ticket.entity";

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(TicketEntity)
        private readonly ticketRepository: Repository<TicketEntity>
    ) {}

    async create(ticket: any): Promise<TicketEntity> {
        return this.ticketRepository.save(ticket);
    }

    async getTicketById(id: number): Promise<TicketEntity> {
        return await this.ticketRepository.findOne({
            relations: ['user'],
            where: {
                id
            }
        });
    }

    async update(ticket: TicketEntity): Promise<TicketEntity> {
        return await this.ticketRepository.save(ticket);
    }

    async delete(ticket: TicketEntity): Promise<any> {
        return await this.ticketRepository.delete(ticket.id);
    }

    async getTicketsByUserId(userId: number): Promise<TicketEntity[]> {
        return await this.ticketRepository.find({
            relations: ['user'],
            where: {
                user_id: userId
            },
            order: {
                id: 'DESC'
            }
        })
    }

    async getLastActiveTicketByUserId(userId: number): Promise<TicketEntity> {
        return await this.ticketRepository.findOne({
            where: {
                user_id: userId,
                is_closed: 0
            }
        })
    }

    async getUserTicket(id: number, userId: number): Promise<TicketEntity> {
        return await this.ticketRepository.findOne({
            where: {
                id,
                user_id: userId
            }
        })
    }

    async getAll(): Promise<TicketEntity[]> {
        return await this.ticketRepository.find({
            relations: ['user'],
            where: {
                last_user: true
            },
            order: {
                id: 'DESC'
            }
        })
    }

    async getTickets(data): Promise<TicketEntity[]> {
        const queryBuilder = this.ticketRepository.createQueryBuilder('ticket')
        queryBuilder.leftJoinAndSelect("ticket.user", "user")
        queryBuilder.orderBy(`ticket.${data.columnName}`, data.columnSortOrder.toUpperCase())
        queryBuilder.where(
            `ticket.subject LIKE '%${data.searchValue}%' OR ticket.user_id LIKE '%${data.searchValue}%'`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountTickets(): Promise<number> {
        const sum = await this.ticketRepository.createQueryBuilder()
            .select('COUNT(id)', 'cnt')
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }
}
