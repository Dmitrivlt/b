import {Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository, UpdateResult} from 'typeorm';
import { BotEntity } from "../entites/bot.entity";

@Injectable()
export class BotsService {
    constructor(
        @InjectRepository(BotEntity)
        private readonly botRepository: Repository<BotEntity>
    ) {
    }

    async findAll(): Promise<BotEntity[]> {
        return await this.botRepository.find();
    }

    async findEnabledAll(): Promise<BotEntity[]> {
        return await this.botRepository.find({
            where: {
                enabled: true
            }
        });
    }

    async create(data: any): Promise<any> {
        return await this.botRepository.save(
            this.botRepository.create(data)
        );
    }

    async delete(botId: number): Promise<any> {
        return await this.botRepository.delete(botId);
    }

    async findById(botId: number): Promise<BotEntity> {
        return await this.botRepository.findOne(botId);
    }

    async findBySteamId(steamId: string): Promise<BotEntity> {
        return await this.botRepository.findOne({
            where: {
                steamid: steamId
            }
        });
    }

    async updateById(botId: number, data: any): Promise<UpdateResult> {
        return await this.botRepository.update(botId, data);
    }
}
