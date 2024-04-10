import {Controller, Get, HttpException, Logger, Post, Request, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {GiveawaysService} from "./giveaways.service";
import {GiveawayEntity} from "../entites/giveaway.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AppGateway} from "../app.gateway";
import {Cron, CronExpression} from "@nestjs/schedule";
import {BetsService} from "../games/bets.service";
import SteamGroup from 'steam-group-members';
import {Constants} from "../constants";

@ApiTags('Giveaways')
@Controller('giveaways')
export class GiveawaysController {
    private giveaway: GiveawayEntity;
    private lastGiveaways: GiveawayEntity[];
    private lastFinishedGiveaway: GiveawayEntity;

    constructor(
        private giveawaysService: GiveawaysService,
        private readonly logger: Logger,
        private readonly appGateway: AppGateway,
        private readonly betsService: BetsService
    ) {
        this.logger.setContext('Розыгрыш');
    }

    async onApplicationBootstrap() {
        this.giveaway = await this.giveawaysService.getActiveGiveaway();
        this.lastGiveaways = await this.giveawaysService.getLastActiveGiveaways();
        this.lastFinishedGiveaway = await this.giveawaysService.getLastFinishedGiveaway();

        this.giveaway ?
            this.logger.debug(
                `Текущий розыгрыш предмета ${this.giveaway.item.market_hash_name} за ${this.giveaway.item.price}$. Статус: ${this.giveaway.is_finished ? 'закончен': 'ожидает'}.`
            )
            : this.logger.error(`Текущего розыгрыша нет`);
    }

    @ApiOperation({ summary: 'Информация о текущем розыгрыше' })
    @Get('giveaway')
    async getGiveaway(): Promise<any> {
        return {
            giveaway: this.giveaway,
            lastGiveaways: this.lastGiveaways,
            lastFinishedGiveaway: this.lastFinishedGiveaway
        }
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Запрос на присоединение к розыгрышу' })
    @ApiBearerAuth()
    @Post('join')
    async joinGiveaway(@Request() req): Promise<any> {
        const { user } = req;

        if (!this.giveaway || this.giveaway.is_finished) {
            throw new HttpException('No active giveaway', 400);
        }

        if (await this.betsService.getBetInSite(req.user.id) === 0) {
            throw new HttpException('You must place a bid on the site', 400);
        }

        if (req.user.username.toLowerCase().indexOf('rustyhot.com') === -1) {
            throw new HttpException('Add RUSTYHOT.com to your nickname', 400);
        }

        if (await this.giveawaysService.getBetUserInGiveaway(this.giveaway.id, user.id)) {
            throw new HttpException('You are already participating in this giveaway', 400);
        }

        await this.giveawaysService.newGiveawayBet(this.giveaway.id, user.id);

        this.giveaway.users += 1;

        await this.giveawaysService.updateGiveaway(this.giveaway);

        this.appGateway.server.emit('updateGiveaway', this.giveaway);

        return {
            success: true
        }
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async setWinner() {
        if (!this.giveaway || this.giveaway.is_finished) {
            return;
        }

        if ((+ new Date(this.giveaway.end_time)) > (+ new Date())) {
            return;
        }

        if (this.giveaway.users <= 0) {
            this.giveaway.end_time = new Date(new Date().getTime() + 5 * 60000);
            this.giveaway = await this.giveawaysService.updateGiveaway(this.giveaway);

            this.appGateway.server.emit('updateGiveaway', this.giveaway);

            return;
        }

        const winData = await this.giveawaysService.setWinner(this.giveaway.id);

        this.giveaway.winner = winData.winner;
        this.giveaway.winner_chance = winData.chance;
        this.giveaway.is_finished = true;

        await this.giveawaysService.updateGiveaway(this.giveaway);

        this.giveaway = await this.giveawaysService.getGiveawayById(this.giveaway.id);
        this.lastGiveaways = await this.giveawaysService.getLastActiveGiveaways();
        this.lastFinishedGiveaway = await this.giveawaysService.getLastFinishedGiveaway();

        this.appGateway.server.emit('startRouletteGiveaway', {
            avatars: winData.avatars,
            giveaway: this.giveaway,
            lastGiveaways: this.lastGiveaways,
            lastGiveaway: this.lastFinishedGiveaway
        });
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkCreatedGiveaway() {
        this.giveaway = await this.giveawaysService.getActiveGiveaway();
    }
}
