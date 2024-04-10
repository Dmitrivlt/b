import {Body, Controller, Get, HttpException, Param, Post, UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard";
import {CommissionItemsService} from "../games/commissionItems.service";
import {BotsManagerService} from "../bots/bots-manager.service";

@Controller('admin/comission')
export class AdminComissionController {
    constructor(
        private commissionItemsService: CommissionItemsService,
        private botsManagerService: BotsManagerService
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('')
    async getComission(@Param('id') id): Promise<any> {
        const items = await this.commissionItemsService.findByAll();

        items.map((item) => {
            item.item = JSON.parse(item.item);
        })

        return items;
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('send')
    async sendItems(@Body() body): Promise<any> {
        const { trade_url, items } = body

        if (trade_url.length < 10) {
            throw new HttpException('Введите ссылку на обмен', 400)
        }

        const botItems = [];

        for (const itemId of Object.keys(items)) {
            const item = await this.commissionItemsService.findById(parseInt(itemId));
            const botItem = JSON.parse(item.item);

            if (typeof botItems[item.bot_id.toString()] === 'undefined') {
                botItems[item.bot_id.toString()] = [];
            }

            botItem.itemId = itemId;

            botItems[item.bot_id.toString()].push(botItem);
        }

        for (const botId in botItems) {
            const statusSend = await this.botsManagerService.sendCommissionItems(
                parseInt(botId),
                trade_url,
                botItems[botId]
            );

            if (statusSend) {
                for (const item of botItems[botId]) {
                    this.commissionItemsService.delete(parseInt(item.itemId));
                }
            }
        }

        return true
    }
}