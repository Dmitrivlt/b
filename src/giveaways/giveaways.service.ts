import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {GiveawayEntity} from "../entites/giveaway.entity";
import {Repository} from "typeorm";
import {GiveawayBetEntity} from "../entites/giveawayBet.entity";

@Injectable()
export class GiveawaysService {
    constructor(
        @InjectRepository(GiveawayEntity)
        private readonly giveawaysRepository: Repository<GiveawayEntity>,
        @InjectRepository(GiveawayBetEntity)
        private readonly giveawaysBetRepository: Repository<GiveawayBetEntity>
    ) {
    }

    async getGiveawayById(giveawayId: number): Promise<GiveawayEntity> {
        return await this.giveawaysRepository.findOne({
            relations: ['winner', 'item'],
            where: {
                id: giveawayId
            }
        });
    }

    async getActiveGiveaway(): Promise<GiveawayEntity> {
        let giveaway = await this.giveawaysRepository.findOne({
            relations: ['winner', 'item'],
            order: {
                winner_id: 'ASC'
            }
        });

        if (!giveaway) {
            giveaway = await this.getLastFinishedGiveaway();
        }

        return giveaway;
    }

    async getLastFinishedGiveaway(): Promise<GiveawayEntity> {
        return await this.giveawaysRepository.findOne({
            relations: ['winner', 'item'],
            where: {
                is_finished: true
            },
            order: {
                id: 'DESC'
            }
        });
    }

    async getLastActiveGiveaways(): Promise<GiveawayEntity[]> {
        return await this.giveawaysRepository.find({
            relations: ['winner', 'item'],
            where: {
                is_finished: true
            },
            order: {
                id: 'DESC'
            },
            take: 5
        });
    }

    async getAllGiveaways(limit = 20): Promise<GiveawayEntity[]> {
        return await this.giveawaysRepository.find({
            relations: ['winner', 'item'],
            order: {
                id: 'DESC'
            },
            take: limit
        });
    }

    async getWinnerBetInGiveaway(giveawayId: number): Promise<GiveawayBetEntity> {
        return await this.giveawaysBetRepository.createQueryBuilder('bet')
            .leftJoinAndSelect('bet.user', 'user')
            .where(`giveaway_id = ${giveawayId}`)
            .orderBy('RAND()')
            .getOne();
    }

    async getBetUserInGiveaway(giveawayId: number, userId: number): Promise<GiveawayBetEntity> {
        return await this.giveawaysBetRepository.findOne({
            where: {
                giveaway_id: giveawayId,
                user_id: userId
            }
        })
    }

    async getBetsUsersInGiveaway(giveawayId: number): Promise<GiveawayBetEntity[]> {
        return await this.giveawaysBetRepository.find({
            relations: ['user'],
            where: {
                giveaway_id: giveawayId
            }
        })
    }

    async getBetsUserById(userId: number): Promise<GiveawayBetEntity[]> {
        return await this.giveawaysBetRepository.find({
            relations: ['giveaway'],
            where: {
                user_id: userId
            }
        });
    }

    async getBetById(id: number): Promise<GiveawayBetEntity> {
        return await this.giveawaysBetRepository.findOne({
            relations: ['giveaway'],
            where: {
                id
            }
        });
    }

    async newGiveawayBet(giveawayId: number, userId: number): Promise<GiveawayBetEntity> {
        return this.giveawaysBetRepository.save({
            giveaway_id: giveawayId,
            user_id: userId
        });
    }

    async deleteBetById(id: number): Promise<any> {
        return await this.giveawaysRepository.delete(id);
    }

    async deleteById(giveawayId: number): Promise<any> {
        return await this.giveawaysRepository.delete(giveawayId);
    }

    async updateGiveaway(giveaway: GiveawayEntity): Promise<GiveawayEntity> {
        return await this.giveawaysRepository.save(giveaway);
    }

    async createGiveaway(data: any): Promise<GiveawayEntity> {
        const giveaway = await this.giveawaysRepository.create();
        giveaway.users = 0;
        giveaway.item_id = data.item_id;
        giveaway.winner_chance = null;
        giveaway.winner_id = null;
        giveaway.end_time = new Date(data.end_time);
        giveaway.is_finished = false;

        return await this.giveawaysRepository.save(giveaway);
    }

    async setWinner(giveawayId: number): Promise<any> {
        const giveaway = await this.getGiveawayById(giveawayId);
        const bets = await this.getBetsUsersInGiveaway(giveawayId);
        const winBet = await this.getWinnerBetInGiveaway(giveawayId);
        const chance = ((1 / giveaway.users) * 100).toFixed(2);

        let avatars = [];

        for (const bet of bets) {
            for (let i = 1; i <= 100; i++) {
                avatars.push({
                    avatar: bet.user.avatar,
                    chance: chance
                })
            }
        }

        avatars = await this.shuffle(avatars);
        avatars[80] = {
            avatar: winBet.user.avatar,
            chance: chance
        };

        return {
            winner: winBet.user,
            avatars,
            chance
        }
    }

    async shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async getGiveaways(data): Promise<GiveawayEntity[]> {
        const queryBuilder = this.giveawaysRepository.createQueryBuilder('giveaway')
        queryBuilder.leftJoinAndSelect("giveaway.winner", "winner")
        queryBuilder.leftJoinAndSelect("giveaway.item", "item")
        queryBuilder.orderBy(`giveaway.${data.columnName}`, data.columnSortOrder.toUpperCase())
        queryBuilder.where(
            `giveaway.id LIKE '%${data.searchValue}%' OR giveaway.item_id LIKE '%${data.searchValue}%' OR giveaway.winner_id LIKE '%${data.searchValue}%'`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountAllGiveaways() {
        const sum = await this.giveawaysRepository.createQueryBuilder()
            .select('COUNT(id)', 'cnt')
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }
}
