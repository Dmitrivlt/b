import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {LessThanOrEqual, MoreThanOrEqual, Repository} from "typeorm";
import {BetEntity} from "../entites/bet.entity";

@Injectable()
export class BetsService {
    constructor(
        @InjectRepository(BetEntity)
        private readonly betRepository: Repository<BetEntity>
    ) {
    }

    async getAllBets(gameId: number): Promise<BetEntity[]> {
        return await this.betRepository.find({
            relations: ['user'],
            where: {
                game_id: gameId
            },
            order: {
                to: 'ASC'
            }
        })
    }

    async getAllRealBets(gameId: number): Promise<BetEntity[]> {
        return await this.betRepository.find({
            relations: ['user'],
            where: {
                game_id: gameId,
                is_fake: false
            },
            order: {
                to: 'ASC'
            }
        })
    }

    async getLastBet(gameId: number): Promise<BetEntity> {
        return await this.betRepository.findOne({
            where: {
                game_id: gameId
            },
            order: {
                to: 'DESC'
            }
        })
    }

    async getRandomFakeBet(gameId) {
        return await this.betRepository.createQueryBuilder()
            .where(`game_id = ${gameId} AND is_fake = 1`)
            .orderBy('RAND()')
            .getOne()
    }

    async getWinBet(gameId: number, ticket: number): Promise<BetEntity> {
        return await this.betRepository.findOne({
            relations: ['user'],
            where: {
                game_id: gameId,
                from: LessThanOrEqual(parseFloat(ticket.toFixed(0))),
                to: MoreThanOrEqual(parseFloat(ticket.toFixed(0)))
            },
        })
    }

    async getUsers(gameId: number): Promise<number> {
        const bets = await this.betRepository.createQueryBuilder('')
            .where(`game_id = ${gameId}`)
            .groupBy('user_id')
            .execute()

        return bets.length;
    }

    async getUserSumBet(userId: number, gameId: number): Promise<number> {
        const bets = await this.betRepository.createQueryBuilder('')
            .where(`game_id = ${gameId} AND user_id = ${userId}`)
            .select("SUM(sum)", "sum")
            .execute()

        return bets[0].sum;
    }

    async getHistoryInWinnerId(userId: number): Promise<BetEntity[]> {
        return await this.betRepository.createQueryBuilder('bet')
            .leftJoin('bet.game', 'game')
            .addSelect(['game.id', 'game.bank', 'game.commission_bank', "SUM(bet.sum) AS sum", 'game.winner_id', 'game.status'])
            .where(`bet.user_id = ${userId}`)
            .where('game.status = 3')
            .groupBy('bet.game_id')
            .execute();
    }

    async getBetInSite(userId: number): Promise<number> {
        return await this.betRepository.count({
            where: {
                user_id: userId
            }
        })
    }

    async create(data: any): Promise<BetEntity> {
        return await this.betRepository.save(data);
    }

    async getBetsByUserId(userId: number, data): Promise<BetEntity[]> {
        const queryBuilder = this.betRepository.createQueryBuilder('bet')
        queryBuilder.leftJoinAndSelect('bet.game', 'game')
        if (data.columnName.indexOf('game') > -1) {
            queryBuilder.orderBy(data.columnName, data.columnSortOrder.toUpperCase())
        } else {
            queryBuilder.orderBy(`bet.${data.columnName}`, data.columnSortOrder.toUpperCase())
        }
        queryBuilder.where(
            `bet.user_id = ${userId} AND (bet.game_id LIKE '%${data.searchValue}%')`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)
        queryBuilder.groupBy('bet.game_id')

        return queryBuilder.getMany()
    }

    async getUserBetInGame(userId: number, gameId: number) {
        return await this.betRepository.findOne({
            where: {
                user_id: userId,
                game_id: gameId
            }
        })
    }

    async getCountBetsByUserId(userId: number) {
        const sum = await this.betRepository.createQueryBuilder()
            .select('COUNT(DISTINCT game_id)', 'cnt')
            .where(`user_id = ${userId}`)
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }
}