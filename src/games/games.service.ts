import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {GameEntity} from "../entites/game.entity";
import randomInt from "random-int";
import crypto from 'crypto';

@Injectable()
export class GamesService {
    constructor(
        @InjectRepository(GameEntity)
        private readonly gameRepository: Repository<GameEntity>
    ) {
    }

    async getById(gameId: number): Promise<GameEntity> {
        return await this.gameRepository.findOne({
            relations: ['user'],
            where: {
                id: gameId
            }
        });
    }

    async getLastGame(): Promise<GameEntity> {
        let game = await this.gameRepository.findOne({
            order: {
                id: 'DESC'
            }
        });

        if (!game) {
            game = await this.create();
        }

        return game;
    }

    async getLastFinishGame(): Promise<GameEntity> {
        return await this.gameRepository.findOne({
            relations: ['user'],
            where: {
                status: 3
            },
            order: {
                id: 'DESC'
            }
        });
    }

    async getLuckyFinishGame(): Promise<GameEntity> {
        return await this.gameRepository.findOne({
            relations: ['user'],
            where: {
                status: 3
            },
            order: {
                bank: 'DESC'
            }
        });
    }

    async getHistory(limit = 20): Promise<GameEntity[]> {
        return await this.gameRepository.createQueryBuilder('game')
            .leftJoin('game.user', 'user')
            .addSelect(['user.id', 'user.username', 'user.avatar', 'user.steamId', 'user.lvl'])
            .where('status = 3')
            .orderBy('game.id', 'DESC')
            .limit(limit)
            .getMany();
    }

    async getProfitToday(): Promise<number> {
        const today = new Date();
        today.setHours(0,0,0,0);

        return await this.getProfit(today);
    }

    async getProfitWeek(): Promise<number> {
        const d = new Date(),
            day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6:1),
            week = new Date(d.setDate(diff));

        week.setHours(0,0,0,0);

        return await this.getProfit(week);
    }

    async getProfitMonth(): Promise<number> {
        const date = new Date(),
            month = new Date(date.getFullYear(), date.getMonth(), 1);

        month.setHours(0,0,0,0);

        return await this.getProfit(month);
    }

    async getProfitAllTime(): Promise<number> {
        const date = new Date(1);

        return await this.getProfit(date);
    }

    async getProfit(date: Date): Promise<number> {
        const sum = await this.gameRepository.createQueryBuilder('game')
            .select('SUM(commission_bank)', 'sum')
            .where(`created_at >= :date`, {date})
            .getRawOne();

        return sum.sum === null ? 0.00 : sum.sum.toFixed(2);
    }

    async create(): Promise<GameEntity> {
        const game = await this.gameRepository.create({});
        game.round_number = `0.${randomInt(100000000, 999999999)}${randomInt(100000000, 999999999)}`;
        game.hash = crypto.createHash('sha256').update(game.round_number).digest('hex');

        return await this.gameRepository.save(game);
    }

    async update(game: GameEntity): Promise<GameEntity> {
        return await this.gameRepository.save(game);
    }

    async getGamesUnSendCommission(): Promise<GameEntity[]> {
        return await this.gameRepository.createQueryBuilder('game')
            .where('game.error_send_bot_ids <> NULL')
            .getMany();
    }

    async getGameById(id: number): Promise<GameEntity> {
        return await this.gameRepository.findOne({
            relations: ['user'],
            where: {
                id,
                status: 3
            }
        })
    }

    async getGames(data): Promise<GameEntity[]> {
        const queryBuilder = this.gameRepository.createQueryBuilder('game')
        queryBuilder.leftJoinAndSelect("game.user", "user")
        if (data.columnName === 'user.username') {
            queryBuilder.orderBy(data.columnName, data.columnSortOrder.toUpperCase())
        } else {
            queryBuilder.orderBy(`game.${data.columnName}`, data.columnSortOrder.toUpperCase())
        }
        queryBuilder.where(
            `game.status = 3 AND (game.id LIKE '%${data.searchValue}%' OR user.username LIKE '%${data.searchValue}%')`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountAllGames() {
        const sum = await this.gameRepository.createQueryBuilder()
            .where('status = 3')
            .select('COUNT(id)', 'cnt')
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }
}
