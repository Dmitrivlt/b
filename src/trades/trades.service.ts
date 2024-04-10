import { Injectable } from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TradeEntity} from "../entites/trade.entity";
import {Repository} from "typeorm";

@Injectable()
export class TradesService {
    constructor(
        @InjectRepository(TradeEntity)
        private tradeRepository: Repository<TradeEntity>
    ) {
    }

    async createTrade(data: any): Promise<TradeEntity> {
        return await this.tradeRepository.save(
            this.tradeRepository.create({
                user_id: data.user_id,
                game_id: data.game_id,
                order_id: data.order_id,
                items: JSON.stringify(data.items),
                type: data.type,
                status: data.status
            })
        )
    }

    async update(trade: TradeEntity): Promise<TradeEntity> {
        return await this.tradeRepository.save(trade)
    }

    async findById(id: any): Promise<TradeEntity> {
        return await this.tradeRepository.findOne(id)
    }

    async findByOfferId(offerId: any): Promise<TradeEntity> {
        return await this.tradeRepository.findOne({
            order_id: offerId
        })
    }

    async findByGameId(gameId: number): Promise<TradeEntity[]> {
        return await this.tradeRepository.find({
            relations: ['user'],
            where: {
                game_id: gameId
            }
        })
    }

    async getTradesByUserId(userId: number, data): Promise<TradeEntity[]> {
        const queryBuilder = this.tradeRepository.createQueryBuilder('trade')
        queryBuilder.leftJoinAndSelect('trade.game', 'game')
        queryBuilder.orderBy(`trade.${data.columnName}`, data.columnSortOrder.toUpperCase())
        queryBuilder.where(
            `trade.user_id = ${userId} AND (trade.game_id LIKE '%${data.searchValue}%')`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountTradesByUserId(userId: number) {
        const sum = await this.tradeRepository.createQueryBuilder()
            .select('COUNT(id)', 'cnt')
            .where(`user_id = ${userId}`)
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }
}
