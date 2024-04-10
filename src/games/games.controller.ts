import {Controller, Get, HttpException, Param} from '@nestjs/common';
import { GameService } from "./game.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {GameEntity} from "../entites/game.entity";

@ApiTags('Games')
@Controller('games')
export class GamesController {
    constructor(
        private gameService: GameService
    ) {}

    @ApiOperation({ summary: 'Информация о текущей игре' })
    @Get('game')
    async getGame(): Promise<any> {
        return {
            game: {
                bank: this.gameService.game.bank,
                status: this.gameService.game.status,
                winner: this.gameService.winner,
                avatars: this.gameService.avatars,
                roulette: this.gameService.roulette,
                win_ticket: this.gameService.game.win_ticket,
                all_tickets: this.gameService.game.all_tickets
            },
            lastWinner: this.gameService.lastWinner,
            luckyWinner: this.gameService.luckyWinner,
            bets: this.gameService.bets
        }
    }

    @ApiOperation({ summary: 'История последних 20 игр' })
    @Get('history')
    async getHistory(): Promise<GameEntity[]> {
        return this.gameService.history;
    }

    @ApiOperation({ summary: 'История игры' })
    @Get('gameById/:id')
    async getGameById(@Param('id') id): Promise<any> {
        try {
            const game = await this.gameService.getGameById(id)

            return {
                game: {
                    bank: game.bank,
                    status: game.status,
                    winner: {
                        bank: game.bank.toFixed(2),
                        chance: game.chance,
                        user: {
                            username: game.user.username,
                            avatar: game.user.avatar,
                            lvl: game.user.lvl
                        }
                    },
                    round_number: game.round_number,
                    hash: game.hash,
                    win_ticket: game.win_ticket,
                    all_tickets: game.all_tickets
                },
                bets: await this.gameService.getBetsById(id)
            }
        } catch (e) {
            throw new HttpException('Игра не найдена', 400)
        }
    }

    @ApiOperation({ summary: 'Получить настройки игры' })
    @Get('config')
    async getConfig(): Promise<any> {
        return {
            time_to_start: this.gameService.settings.game_time_to_start,
            fee: this.gameService.settings.game_fee,
            min_bet: this.gameService.settings.game_min_bet
        }
    }
}
