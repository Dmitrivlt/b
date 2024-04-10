import {Logger, HttpException, Injectable} from '@nestjs/common';
import {Bot} from "./bot";
import {BotsService} from "./bots.service";
import {UserEntity} from "../entites/user.entity";
import {CEconItemDto} from "../dto/ceconitem.dto";
import randomInt from 'random-int';
import {GameService} from "../games/game.service";
import {UsersService} from "../users/users.service";
import {BotEntity} from "../entites/bot.entity";
import {TradesService} from "../trades/trades.service";

@Injectable()
export class BotsManagerService {
    private bots: Bot[];

    constructor(
        private readonly botService: BotsService,
        private readonly logger: Logger,
        private readonly gameService: GameService,
        private readonly userService: UsersService,
        private readonly tradeService: TradesService
    ) {
        this.bots = [];
    }

    async onApplicationBootstrap() {
        const bots = await this.botService.findEnabledAll();

        for (const bot of bots) {
            this.bots.push(new Bot(bot, this.logger, this.gameService, this.userService, this.tradeService, this.botService));
        }
    }

    async getUserInventory(steamId: string): Promise<any> {
        try {
            return await this.bots[0].getUserInventory(steamId);
        } catch (e) {
            throw new HttpException(e, 400);
        }
    }

    async getSteamIdByTradeUrl(url: string): Promise<string> {
        return await this.bots[0].getSteamIdByTradeUrl(url);
    }

    async depositItems(
        user: UserEntity,
        items: CEconItemDto[]
    ): Promise<any> {
        return await this.bots[await this.getRandomBot('deposit')].createOffer(user, items);
    }

    async sendItems(
        botId: number,
        user: UserEntity,
        items: CEconItemDto[],
        message: string,
        gameId: number
    ) {
        const index = this.bots.findIndex(x => x.id === botId);

        return await this.bots[index].sendItems(user, items, message, gameId);
    }

    async sendCommissionItems(
        botId: number,
        trade_url: string,
        items: any
    ) {
        const index = this.bots.findIndex(x => x.id === botId);

        return await this.bots[index].sendCommissionItems(trade_url, items);
    }

    async sendBotTrade() {
        try {
            const botIndex = await this.getRandomBot('bot')
            const depositIndex = await this.getRandomBot('deposit')

            if (botIndex === -1 || depositIndex === -1) {
                return
            }

            const items = await this.bots[botIndex].getUserInventory(this.bots[botIndex].data.steamid)

            if (items.length === 0) {
                return
            }

            const item = items[randomInt(1, items.length) - 1]

            this.bots[depositIndex].createOffer(this.bots[botIndex].data, [item], 'bot')

            const bot = await this.botService.findById(this.bots[botIndex].data.id)
            bot.count_games += 1

            this.botService.updateById(bot.id, bot)

            if (bot.count_games === 25) {
                this.bots[botIndex].updateInfo()
            }
        } catch (e) {

        }
    }

    async sendBonusTrade() {
        try {
            const bonusIndex = await this.getRandomBot('bonus')
            const depositIndex = await this.getRandomBot('deposit')

            if (bonusIndex === -1 || depositIndex === -1) {
                return
            }

            const items = await this.bots[bonusIndex].getUserInventory(this.bots[bonusIndex].data.steamid)

            if (items.length === 0) {
                return
            }

            const item = items[randomInt(1, items.length) - 1]

            this.bots[depositIndex].createOffer(this.bots[bonusIndex].data, [item], 'bonus')

            const bot = await this.botService.findById(this.bots[bonusIndex].data.id)
            bot.count_games += 1

            this.botService.updateById(bot.id, bot)
        } catch (e) {

        }
    }

    async addBot(bot: BotEntity) {
        this.bots.push(new Bot(bot, this.logger, this.gameService, this.userService, this.tradeService, this.botService));

        return true;
    }

    async deleteBot(botId: number) {
        const index = this.bots.findIndex(x => x.id === parseInt(String(botId)));

        if (index > -1) {
            this.bots.splice(index, 1);
        }

        return true;
    }

    async rebootBot(botId: number) {
        const bot = await this.botService.findById(botId)

        if (bot) {
            this.logger.debug(`Перезапуск бота ${bot.username}`)

            await this.deleteBot(botId);

            setTimeout(() => {
                this.bots.push(new Bot(bot, this.logger, this.gameService, this.userService, this.tradeService, this.botService));
            }, 1000)
        }
    }

    async enableBot(botId: number, enable: boolean) {
        const bot = await this.botService.findById(botId)

        if (bot) {
            bot.enabled = enable

            await this.botService.updateById(bot.id, bot)

            if (enable) {
                this.logger.debug(`Бот ${bot.username} запущен`)

                this.bots.push(new Bot(bot, this.logger, this.gameService, this.userService, this.tradeService, this.botService));
            } else {
                this.logger.debug(`Бот ${bot.username} выключен`)

                await this.deleteBot(botId)
            }
        }
    }

    async getRandomBot(type: string) {
        let existBot = false

        await Promise.all(this.bots.map(bot => {
            if (bot.data.type === type) {
                existBot = true
            }
        }))

        if (!existBot) {
            return -1
        }

        let index = -1

        while (index === -1) {
            const botId = randomInt(1, this.bots.length) - 1;

            if (this.bots[botId].data.type === type) {
                index = botId
            }
        }

        return index
    }
}
