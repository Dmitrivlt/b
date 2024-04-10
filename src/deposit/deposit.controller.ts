import {Controller, Post, UseGuards, Body, Request, HttpException} from '@nestjs/common';
import { BotsManagerService } from "../bots/bots-manager.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import { CEconItemDto } from "../dto/ceconitem.dto";
import {PricesService} from "../prices/prices.service";
import {Constants} from "../constants";
import {SettingsService} from "../settings/settings.service";
import {Cron, CronExpression} from "@nestjs/schedule";

@ApiTags('Deposit')
@Controller('deposit')
export class DepositController {
    public settings: any;

    constructor(
        private readonly botsManagerService: BotsManagerService,
        private readonly priceService: PricesService,
        private readonly settingsService: SettingsService
    ) {
    }

    async onApplicationBootstrap() {
        this.settings = await this.settingsService.getSettings();
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Запрос на депозит скинами' })
    @ApiBearerAuth()
    @Post('deposit')
    async deposit(@Body() items: CEconItemDto[], @Request() req): Promise<any> {
        if (req.user.trade_url === null) {
            throw new HttpException('Enter trade link', 400);
        }

        let price = 0.00;

        for (const item of Object.keys(items)) {
            price += await this.priceService.getPriceByMarketHashName(items[item].market_hash_name);
        }

        if (price < this.settings.game_min_bet) {
            throw new HttpException(`Minimum deposit amount: ${this.settings.game_min_bet.toFixed(2)}$`, 400);
        }

        try {
            const offerId = await this.botsManagerService.depositItems(
                req.user,
                items
            );

            return {
                offerId
            }
        } catch (e) {
            if (e.message === 'There was an error sending your trade offer.  Please try again later. (26)') {
                throw new HttpException('Please, refresh inventory', 400);
            }

            throw new HttpException('An error occurred while creating an tradeoffer', 400);
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async getSettings() {
        this.settings = await this.settingsService.getSettings();
    }
}
