import { Injectable } from '@nestjs/common';
import { RedisService } from "nestjs-redis";
import * as Redis from 'ioredis';

@Injectable()
export class ChatService {
    private service: Redis.Redis;

    constructor(
        private readonly redisService: RedisService,
    ) {
        this.service = this.redisService.getClient('app');
    }

    async getChat() {
        const data = await this.service.lrange('chat', 0, -1);
        const messages = [];
        let i = 0;

        for (const chat of data.reverse()) {
            if (i === 20) break;

            messages.unshift(JSON.parse(chat));
            i += 1;
        }

        return messages
    }

    async addMessage(msg: any) {
        await this.service.rpush('chat', JSON.stringify(msg));
    }

    async deleteMessage(msg: any) {
        await this.service.lrem('chat', -1, JSON.stringify(msg));
    }

    async clearChat() {
        await this.service.del('chat');
    }
}
