import {
    Body,
    Controller,
    Get, HttpException, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import {GamesService} from "../games/games.service";
import {UsersService} from "../users/users.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard";
import {Utils} from "../utils";
import {BetsService} from "../games/bets.service";
import {TradesService} from "../trades/trades.service";
import {ItemsService} from "../items/items.service";
import {AppGateway} from "../app.gateway";
import {GameService} from "../games/game.service";
import randomInt from "random-int";

@Controller('admin')
export class AdminController {
    constructor(
        private readonly gamesService: GamesService,
        private readonly usersService: UsersService,
        private readonly betsService: BetsService,
        private readonly tradesService: TradesService,
        private readonly itemService: ItemsService,
        private readonly utils: Utils,
        private readonly appGateway: AppGateway,
        private readonly gameService: GameService,
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('statistic')
    async root() {
        const lastGame = await this.gamesService.getLastGame();

        return {
            today: await this.gamesService.getProfitToday(),
            week: await this.gamesService.getProfitWeek(),
            month: await this.gamesService.getProfitMonth(),
            all: await this.gamesService.getProfitAllTime(),
            usersRegistration: await this.usersService.getLastUsers(),
            history: await this.gamesService.getHistory(),
            gameBets: await this.betsService.getAllBets(lastGame.id),
            lastGame
        };
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('setWinner/:id')
    async setWinner(@Param('id') id) {
        const lastGame = await this.gamesService.getLastGame();

        lastGame.winner_id = id;
        await this.gamesService.update(lastGame);

        return true
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('users')
    async getUsers(@Query() query): Promise<any> {
        const {
            draw,
            row,
            length,
            columnName,
            columnSortOrder,
            searchValue
        } = await this.utils.parseDataTableQuery(query)

        const users = await this.usersService.getUsers(
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const usersAll = await this.usersService.getCountAllUsers()

        return {
            draw,
            data: users,
            recordsTotal: usersAll,
            recordsFiltered: usersAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('user/:id')
    async getUser(@Param('id') id): Promise<any> {
        const user = await this.usersService.findById(id)

        if (!user) {
            throw new HttpException('Пользователь не найден', 400)
        }

        const info = {

        }

        return {
            user,
            info
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('user/:id')
    async saveUser(@Param('id') id, @Body() body): Promise<any> {
        const user = await this.usersService.findById(id)

        if (!user) {
            throw new HttpException('Пользователь не найден', 400)
        }

        await this.usersService.updateByRandomData(user.id, body.user)

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('user/:id/getGames')
    async getGamesByUserId(@Param('id') id, @Query() query): Promise<any> {
        const { draw, row, length, columnName, columnSortOrder, searchValue } = await this.utils.parseDataTableQuery(query)

        const bets = await this.betsService.getBetsByUserId(id,
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const betsAll = await this.betsService.getCountBetsByUserId(id)

        return {
            draw,
            data: bets,
            recordsTotal: betsAll,
            recordsFiltered: betsAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('user/:id/getTrades')
    async getTradesByUserId(@Param('id') id, @Query() query): Promise<any> {
        const { draw, row, length, columnName, columnSortOrder, searchValue } = await this.utils.parseDataTableQuery(query)

        const bets = await this.tradesService.getTradesByUserId(id,
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const betsAll = await this.tradesService.getCountTradesByUserId(id)

        return {
            draw,
            data: bets,
            recordsTotal: betsAll,
            recordsFiltered: betsAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('findItemsInInventory')
    async findItemsInInventory(@Query() query): Promise<any> {
        const { search, page } = query

        let items = await this.itemService.findItemsInInventory(search, page, 20)

        items = items.map((item) => {
            return {
                id: item.id,
                text: `${item.market_hash_name} (${item.price.toFixed(2)}$)`
            }
        })

        return {
            results: items,
            more: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('online')
    async getOnline(): Promise<any> {
        return await Promise.all(Object.keys(this.appGateway.onlineUsers).map(async (userId) => {
            return await this.usersService.findById(userId)
        }))
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('rebootSite')
    async rebootSite(): Promise<any> {
        process.exit()
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('getUsers')
    async getAllUsers(@Query() query): Promise<any> {
        const { search, page } = query

        let items = await this.usersService.getAllUsers(search, page, 20)

        items = items.map((item) => {
            return {
                id: item.id,
                text: `${item.username} (${item.steamId})`
            }
        })

        return {
            results: items,
            more: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('fakeBet')
    async fakeBet(@Body() body) {
        body = body.user;

        const user = await this.usersService.findById(body.user_id)

        const itemsRandomCount = randomInt(3, 10)

        const items = []
        let priceMax = randomInt(parseFloat(body.min), parseFloat(body.max)),
            price = 0

        for (let i = 0; i < itemsRandomCount; i += 1) {
            if (priceMax > parseFloat(body.min)) {
                const item = await this.itemService.findByRandomSum(parseFloat(body.min), priceMax)

                if (item && ((item.price + price) <= parseFloat(body.max))) {
                    items.push({
                        assetid: item.id,
                        market_hash_name: item.market_hash_name,
                        icon_url: item.icon_url,
                        price: item.price,
                        name_color: ''
                    })
                    price += item.price
                    priceMax -= item.price
                }
            }
        }

        this.gameService.addBet(1, user, items, null, true)

        return {
            success: true
        }
    }
}
