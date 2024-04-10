import {
    Controller,
    Get, HttpException, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import {GamesService} from "../games/games.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard";
import {Utils} from "../utils";
import {GameService} from "../games/game.service";
import {TradesService} from "../trades/trades.service";

@Controller('admin/games')
export class AdminGamesController {
    constructor(
        private utils: Utils,
        private gamesService: GamesService,
        private gameService: GameService,
        private tradeService: TradesService
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('')
    async getGames(@Query() query): Promise<any> {
        const {
            draw,
            row,
            length,
            columnName,
            columnSortOrder,
            searchValue
        } = await this.utils.parseDataTableQuery(query)

        const users = await this.gamesService.getGames(
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const usersAll = await this.gamesService.getCountAllGames()

        return {
            draw,
            data: users,
            recordsTotal: usersAll,
            recordsFiltered: usersAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('game/:id')
    async getGame(@Param('id') id): Promise<any> {
        const game = await this.gamesService.getById(id)

        if (!game || game.status !== 3) {
            throw new HttpException('Игра не найдена', 400)
        }

        const info = {
            trades: await this.tradeService.findByGameId(game.id)
        }

        return {
            game,
            info
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('trades/:id')
    async getTrades(@Param('id') id): Promise<any> {
        return await this.tradeService.findById(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('game/:id/resend')
    async resendItems(@Param('id') id): Promise<any> {
        await this.gameService.resendItems(id);

        return true
    }
}