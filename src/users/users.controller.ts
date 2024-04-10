import {Controller, Get, Request, UseGuards, Inject, CACHE_MANAGER, HttpException, Post} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth
} from '@nestjs/swagger';
import { UserEntity } from "../entites/user.entity";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotsManagerService } from '../bots/bots-manager.service';
import { CEconItemDto } from "../dto/ceconitem.dto";
import { PricesService } from "../prices/prices.service";

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private userService: UsersService,
        private botsManagerService: BotsManagerService,
        private priceService: PricesService,
        @Inject(CACHE_MANAGER)
        private cacheManager
    ) {
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Информация о текущем пользователе' })
    @ApiResponse({
        status: 200,
        description: 'Информация о пользователе',
        type: UserEntity,
    })
    @ApiBearerAuth()
    @Get('profile')
    async profile(@Request() req): Promise<UserEntity> {
        return this.userService.findBySteamId(req.user.steamId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Получение инвентаря STEAM' })
    @ApiBearerAuth()
    @ApiResponse({
        status: 200,
        description: 'Информация об инвентаре',
        type: CEconItemDto
    })
    @Get('inventory')
    async getInventory(@Request() req): Promise<CEconItemDto[]> {
        return this.cacheManager.wrap(`inventory_${req.user.id}`, async () => {
            try {
                const inventory = await this.botsManagerService.getUserInventory(req.user.steamId);

                const items = [];

                await Promise.all((inventory.map(async (item) => {
                    const price = await this.priceService.getPriceByMarketHashName(item.market_hash_name);

                    if (price > 0) {
                        items.push({
                            assetid: item.assetid,
                            market_hash_name: item.market_hash_name,
                            icon_url: item.icon_url_large,
                            price: price,
                            background_color: item.name_color
                        })
                    }
                })))

                items.sort(function(a, b) {
                    return b.price - a.price;
                });

                return items;
            } catch (e) {
                throw new HttpException('Please, refresh your inventory', 400);
            }
        }, { ttl: 86400 });
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Сбросить кэш инвентаря STEAM' })
    @ApiBearerAuth()
    @Get('inventory/refresh')
    async refreshInventory(@Request() req): Promise<any> {
        this.cacheManager.del(`inventory_${req.user.id}`);

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Сохранение ссылки на обмен' })
    @ApiBearerAuth()
    @Post('saveTradeUrl')
    async saveTradeUrl(@Request() req): Promise<any> {
        const { url } = req.body;

        if (typeof url === 'undefined') {
            throw new HttpException('Enter trade-url', 400);
        }

        const data = url.split('?');

        if (data[1]) {
            if (data[1].indexOf('partner') > -1 && data[1].indexOf('token') > -1) {
                const SteamIDTradeUrl = await this.botsManagerService.getSteamIdByTradeUrl(url);

                if (SteamIDTradeUrl !== req.user.steamId) {
                    throw new HttpException('Invalid trade-url', 400);
                }

                req.user.trade_url = url;
                await this.userService.update(req.user);

                return {
                    success: true
                }
            }

            throw new HttpException('Invalid trade-url', 400);
        }

        throw new HttpException('Invalid trade-url', 400);
    }

    @ApiOperation({ summary: 'Получение топа пользователей' })
    @Get('getTop')
    async getTop(): Promise<UserEntity[]> {
        return this.cacheManager.wrap('getTop', async () => {
            return await this.userService.getTop();
        }, { ttl: 60 });
    }
}
