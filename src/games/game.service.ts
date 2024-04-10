import {forwardRef, Inject, Injectable, Logger} from '@nestjs/common';
import {GameEntity} from "../entites/game.entity";
import {GamesService} from "./games.service";
import {UserEntity} from "../entites/user.entity";
import {PricesService} from "../prices/prices.service";
import {BetsService} from "./bets.service";
import {BotsManagerService} from "../bots/bots-manager.service";
import {BetEntity} from "../entites/bet.entity";
import {AppGateway} from "../app.gateway";
import {UsersService} from "../users/users.service";
import {SettingsService} from "../settings/settings.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {CommissionItemsService} from "./commissionItems.service";
import {TradesService} from "../trades/trades.service";
import randomInt from "random-int";
import {BotsService} from "../bots/bots.service";
import {ItemsService} from "../items/items.service";

@Injectable()
export class GameService {
    public game: GameEntity;
    private timeToStart: number;
    private time: number;
    private timer: any;
    private readonly waitBets: any;
    private readonly toNewGameBets: any;
    public bets: any;
    public avatars: any;
    public winner: any;
    public roulette: boolean;
    public lastWinner: any;
    public luckyWinner: any;
    public history: any;
    public settings: any;

    constructor(
        private readonly gamesService: GamesService,
        private readonly logger: Logger,
        private readonly priceService: PricesService,
        private readonly betsService: BetsService,
        @Inject(forwardRef(() => BotsManagerService))
        private readonly botsManagerService: BotsManagerService,
        private botsService: BotsService,
        private appGateway: AppGateway,
        private usersService: UsersService,
        private settingsService: SettingsService,
        private commissionItemsService: CommissionItemsService,
        private tradesService: TradesService,
        private itemsService: ItemsService
    ) {
        this.logger.setContext('Игра');

        this.waitBets = [];
        this.toNewGameBets = [];
        this.bets = [];
        this.avatars = [];
        this.winner = [];
        this.roulette = false;
        this.history = [];
    }

    async onApplicationBootstrap() {
        try {
            this.settings = await this.settingsService.getSettings();

            this.timeToStart = this.settings.game_time_to_start;
            this.time = this.settings.game_time_to_start;

            this.game = await this.gamesService.getLastGame();

            this.logger.debug(`Текущая игра #${this.game.id}`);

            const bets = await this.betsService.getAllBets(this.game.id);

            if (bets.length <= 1 && this.game.status <= 1) {
                setTimeout(() => {
                    this.addBotBets();
                }, 7000);
            }

            if (this.game.status === 1) {
                await this.startTimer();
            }

            if (this.game.status === 2) {
                await this.startRoll();
            }

            if (this.game.status === 3) {
                await this.newGame();
            }

            this.bets = await this.getBets()

            this.lastWinner = await this.getLastWinner();
            this.luckyWinner = await this.getLuckyWinner();
            this.history = await this.gamesService.getHistory();
    
            this.bets = await this.getBets()
    
            this.lastWinner = await this.getLastWinner();
            this.luckyWinner = await this.getLuckyWinner();
            this.history = await this.gamesService.getHistory();
        } catch (error) {
            this.logger.error(`Ошибка при инициализации: ${error.message}`);
        }
    }

    async startTimer() {
        this.logger.debug(`В игре #${this.game.id} начался таймер`);

        this.timer = setInterval(() => {
            this.logger.debug(`До начала игры #${this.game.id} осталось ${this.time} сек.`);
            this.time--;

            this.appGateway.server.emit('gameTimeToStart', this.time);

            if (this.time === 0) {
                this.game.status = 2;
                this.gamesService.update(this.game);

                this.startRoll();
                clearInterval(this.timer);
            }
        }, 1000);
    }

    async startRoll() {
        this.logger.debug(`Начинается определение победителя в игре #${this.game.id}`);

        this.roulette = true;

        const game = await this.gamesService.getLastGame();

        let winTicket;

        const lastBet = await this.betsService.getLastBet(this.game.id);

        if (game.winner_id) {
            const userBet = await this.betsService.getUserBetInGame(game.winner_id, this.game.id);
            winTicket = randomInt(userBet.from, userBet.to);
            this.game.round_number = (parseInt(winTicket) / lastBet.to).toString();
        } else {
            const userBet = await this.betsService.getRandomFakeBet(this.game.id)
            winTicket = randomInt(userBet.from, userBet.to);
            this.game.round_number = (parseInt(winTicket) / lastBet.to).toString();
        }

        const winBet = await this.betsService.getWinBet(this.game.id, winTicket);

        const userBetSum = await this.betsService.getUserSumBet(winBet.user.id, this.game.id);
        const chance = ((userBetSum / this.game.bank) * 100).toFixed(2);


        this.logger.debug(`В игре #${this.game.id} победил ${winBet.user.username} (${winBet.user.steamId})`);

        const {winItems, commissionItems, winItemsBots, tempPrice, commissionItemsBots} = await this.getCommissionItems(this.game.id, chance);

        // this.sendItems(winBet, winItemsBots, this.game);
        this.setCommissionItems(commissionItemsBots);

        this.game.winner_id = winBet.user_id;
        this.game.commission_items = JSON.stringify(commissionItems);
        this.game.win_items = JSON.stringify(winItems);
        this.game.chance = parseFloat(chance);
        this.game.commission_bank = tempPrice;
        this.game.win_ticket = winTicket;
        this.game.all_tickets = lastBet.to;
        await this.gamesService.update(this.game);

        winBet.user.total_wins += 1;
        winBet.user.total_items += this.game.items;
        winBet.user.total_win += this.game.bank;
        await this.usersService.update(winBet.user);

        this.winner = {
            bank: this.game.bank.toFixed(2),
            chance: chance,
            user: {
                username: winBet.user.username,
                avatar: winBet.user.avatar
            }
        };

        for (const bet of this.bets) {
            const bot = await this.botsService.findBySteamId(bet.user.steamId)

            if (!bot || bot.type !== 'bonus') {
                for (let i = 1; i <= parseFloat(bet.bet.chance) + 130; i++) {
                    this.avatars.push({
                        avatar: bet.user.avatar,
                        chance: bet.bet.chance
                    })
                }
            }
        }

        this.avatars = await this.shuffle(this.avatars);
        this.avatars[80] = {
            avatar: winBet.user.avatar,
            chance: chance
        };

        this.appGateway.server.emit('startRoll', {
            winner: this.winner,
            avatars: this.avatars,
            win_ticket: this.game.win_ticket
        })

        setTimeout(async () => {
            this.appGateway.server.emit('showWinModal', {
                steamId: winBet.user.steamId,
                sum: this.game.bank
            })

            this.game.status = 3;
            await this.gamesService.update(this.game);

            this.history = await this.gamesService.getHistory();

            this.newGame();
        }, 19000);
    }

    async getCommissionItems(gameId: number, chance: any): Promise<any> {
        const winItems = [];
        const commissionItems = [];
        const winItemsBots = [];
        const commissionItemsBots = [];

        const bets = await this.betsService.getAllRealBets(gameId);
        const commissionPrice = this.game.bank * 100;

        let tempPrice = 0;

        for (const bet of bets) {
            const bot = await this.botsService.findBySteamId(bet.user.steamId);
            const items = JSON.parse(bet.items);

            for (const item of items) {
                if ((!bot || bot.type !== 'bonus') && (item.price <= commissionPrice) && (tempPrice < commissionPrice) && (parseFloat(chance) < 90)) {
                    commissionItems.push(item);

                    if (typeof commissionItemsBots[item.bot_id.toString()] === 'undefined') {
                        commissionItemsBots[item.bot_id.toString()] = [];
                    }

                    commissionItemsBots[item.bot_id.toString()].push(item);

                    tempPrice += item.price;
                } else {
                    winItems.push(item);

                    if (typeof winItemsBots[item.bot_id.toString()] === 'undefined') {
                        winItemsBots[item.bot_id.toString()] = [];
                    }

                    winItemsBots[item.bot_id.toString()].push(item);
                }
            }
        }

        return {
            winItems,
            commissionItems,
            winItemsBots,
            tempPrice,
            commissionItemsBots
        }
    }

    async setCommissionItems(botsItems: any) {
        for (const botId in botsItems) {
            const items = botsItems[botId];

            for (const item of items) {
                this.commissionItemsService.create({
                    botId,
                    item
                });
            }
        }
    }

    async sendItems(winBet: BetEntity, winItemsBots: any, game: GameEntity) {
        const errorSendBotsIds = [];
        const tradeOfferMax = winItemsBots.length - 1;
        let sendTradeOffer = 1;

        this.logger.debug(`Отправка выигрыша пользователю ${winBet.user.username} (${winBet.user.steamId})`)

        for (const botId in winItemsBots) {
            const statusSend = await this.botsManagerService.sendItems(
                parseInt(botId),
                winBet.user,
                winItemsBots[botId],
                `Your winnings in the game #${winBet.game_id}. Trade (${sendTradeOffer}/${tradeOfferMax})`,
                game.id
            );

            if (!statusSend) {
                errorSendBotsIds.push(botId);
            }

            sendTradeOffer += 1;
        }

        if (errorSendBotsIds.length > 0) {
            game.error_send_bot_ids = JSON.stringify(errorSendBotsIds);
            await this.gamesService.update(game);
        }
    }

    async resendItems(gameId: number) {
        const game = await this.gamesService.getById(gameId);

        if (game.error_send_bot_ids === null) {
            return;
        }

        const {winItemsBots} = await this.getCommissionItems(game.id, game.chance);

        const errorSendBotsIds = [];
        const errorSendBotsIdsInGame = JSON.parse(game.error_send_bot_ids);
        const tradeOfferMax = winItemsBots.length - 1;
        let sendTradeOffer = 1;

        this.logger.debug(`Переотправка выигрыша пользователю ${game.user.username} (${game.user.steamId})`)

        for (const botId in winItemsBots) {
            if (errorSendBotsIdsInGame.indexOf(botId) > -1) {
                const statusSend = await this.botsManagerService.sendItems(
                    parseInt(botId),
                    game.user,
                    winItemsBots[botId],
                    `Your winnings in the game #${game.id}. Trade (${sendTradeOffer}/${tradeOfferMax})`,
                    game.id
                );

                if (!statusSend) {
                    errorSendBotsIds.push(botId);
                }

                sendTradeOffer += 1;
            }
        }

        if (errorSendBotsIds.length > 0) {
            game.error_send_bot_ids = JSON.stringify(errorSendBotsIds);
            await this.gamesService.update(game);
        } else {
            game.error_send_bot_ids = null;
            await this.gamesService.update(game);
        }

        return true;
    }

    async addBet(botId: number, user: UserEntity, items: any, offerId: any, isFake = false) {
        try {
            const waitBetIndex = this.waitBets.push({
                botId,
                user,
                items
            });

            let parsedItems = [];
            let price = 0.00;

            for (const item of items) {
                const itemPrice = await this.priceService.getPriceByMarketHashName(item.market_hash_name);

                price += itemPrice;

                parsedItems.push({
                    bot_id: botId,
                    assetid: item.assetid,
                    market_hash_name: item.market_hash_name,
                    icon_url: item.icon_url,
                    price: itemPrice,
                    background_color: item.name_color
                });
            }

            parsedItems = parsedItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

            this.logger.debug(`Новый депозит от пользователя ${user.username} (${user.steamId}). Предметов: ${items.length}, на сумму: ${price}$`);

            if (offerId) {
                const trade = await this.tradesService.findByOfferId(offerId)

                if (trade) {
                    if (this.game.status === 2 || this.time <= 2) {
                        trade.game_id = this.game.id + 1
                    } else {
                        trade.game_id = this.game.id
                    }

                    this.tradesService.update(trade)
                }
            }

            if (this.game.status === 2 || this.time <= 2) {
                this.appGateway.sendNotify(user.steamId, 'info', 'Your bet has been carried over to the next game');

                this.logger.debug(`-> Депозит будет перенесен в новую игру`);

                this.toNewGameBets.push(this.waitBets[waitBetIndex - 1]);
                delete this.waitBets[waitBetIndex - 1];

                return;
            }

            const lastBet = await this.betsService.getLastBet(this.game.id);
            let ticketFrom = 1;

            if (lastBet) {
                ticketFrom = lastBet.to + 1;
            }

            let ticketTo = ticketFrom + (price * 100) - 1;

            const bot = await this.botsService.findBySteamId(user.steamId)

            if (bot && bot.type === 'bonus') {
                ticketFrom = 0;
                ticketTo = 0;
            }

            const currentSumBet = await this.betsService.getUserSumBet(user.id, this.game.id);

            if (currentSumBet === null) {
                user.total_played += 1;
                await this.usersService.update(user);
            }

            await this.betsService.create({
                user_id: user.id,
                game_id: this.game.id,
                sum: price,
                items: JSON.stringify(parsedItems),
                items_cnt: parsedItems.length,
                from: ticketFrom,
                to: ticketTo,
                is_fake: isFake
            });

            this.logger.debug(`-> Депозит внесен в игру`);

            const currentUsers = await this.betsService.getUsers(this.game.id);

            if (currentUsers >= this.settings.game_users_to_start && this.game.status === 0) {
                this.game.status = 1;
                this.startTimer();
            }

            if (!bot || bot.type !== 'bonus') {
                this.game.bank += price;
                this.game.items += parsedItems.length;
            }

            this.game.users = currentUsers;

            await this.gamesService.update(this.game);

            this.appGateway.sendNotify(user.steamId, 'success', 'Your bet is in game');

            this.bets = await this.getBets()

            this.appGateway.server.emit('gameNewBet', {
                game: {
                    bank: this.game.bank,
                    status: this.game.status
                },
                bets: this.bets
            })

            user.exp += 25;
            this.usersService.update(user);
            this.usersService.updateLvl(user);

            return;
        } catch (e) {
            this.logger.error(`-> Ошибка вноса депозита в игру. Причина: ${e.message}`);
        }
    }

    async newGame() {
        this.game = await this.gamesService.create();
        this.time = this.timeToStart;
        this.bets = [];
        this.avatars = [];
        this.winner = [];
        this.roulette = false;

        this.lastWinner = await this.getLastWinner();
        this.luckyWinner = await this.getLuckyWinner();

        this.appGateway.server.emit('newGame', {
            lastWinner: this.lastWinner,
            luckyWinner: this.luckyWinner,
        });

        this.logger.debug(`Новая игра #${this.game.id}`);

        // setTimeout(() => {
        //     this.botsManagerService.sendBonusTrade()
        // }, randomInt(3000, 5000))
        //
        // setTimeout(() => {
        //     this.botsManagerService.sendBotTrade()
        // }, randomInt(10000, 20000))

        setTimeout(() => {
            this.addBotBets();
        }, 7000);

        for (const id in this.toNewGameBets) {
            const data = this.toNewGameBets[id];

            this.addBet(data.botId, data.user, data.items, null, false);
            delete this.toNewGameBets[id];
        }
    }

    async addBotBets() {
        const randomNumberUsers = randomInt(Number(this.settings.game_min_fake_users), Number(this.settings.game_max_fake_users))

        const bots = await this.usersService.getRandomBots(randomNumberUsers)

        for (const bot of bots) {
            if (this.game.status === 2 || this.time <= 2) {
                continue
            }

            const itemsRandomCount = randomInt(3, 10)

            const items = []
            let priceMax = randomInt(parseFloat(this.settings.game_min_fake_bet), parseFloat(this.settings.game_max_fake_bet)),
                price = 0

            for (let i = 0; i < itemsRandomCount; i += 1) {
                if (priceMax > parseFloat(this.settings.game_min_fake_bet)) {
                    const item = await this.itemsService.findByRandomSum(parseFloat(this.settings.game_min_fake_bet), priceMax)

                    if (item && ((item.price + price) <= parseFloat(this.settings.game_max_fake_bet))) {
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

            if (items.length > 0) {
                setTimeout(async () => {
                    this.addBet(1, bot, items, null, true);
                }, randomInt(1, (this.settings.game_time_to_start - (this.settings.game_time_to_start * 0.2))) * 1000);
            }
        }
    }

    async getLastWinner() {
        const game = await this.gamesService.getLastFinishGame();

        if (game) {
            return {
                user: {
                    username: game.user.username,
                    avatar: game.user.avatar,
                    steamId: game.user.steamId,
                    lvl: game.user.lvl
                },
                sum: game.bank,
                chance: game.chance,
                items: game.items
            };
        } else {
            return null;
        }
    }

    async getLuckyWinner() {
        const game = await this.gamesService.getLuckyFinishGame();

        if (game) {
            return {
                user: {
                    username: game.user.username,
                    avatar: game.user.avatar,
                    steamId: game.user.steamId,
                    lvl: game.user.lvl
                },
                sum: game.bank,
                chance: game.chance,
                items: game.items
            };
        } else {
            return null;
        }
    }

    async getGameById(id: number) {
        return await this.gamesService.getGameById(id)
    }

    async getBetsById(id: number) {
        const game = await this.gamesService.getById(id)
        const bets = []

        for (const bet of await this.betsService.getAllBets(id)) {
            const betSum = await this.betsService.getUserSumBet(bet.user.id, id);

            bets.unshift({
                id: bet.id,
                user: {
                    id: bet.user.id,
                    avatar: bet.user.avatar,
                    username: bet.user.username,
                    steamId: bet.user.steamId,
                    lvl: bet.user.lvl
                },
                bet: {
                    chance: ((betSum / game.bank) * 100).toFixed(2),
                    items: JSON.parse(bet.items),
                    sum: bet.sum,
                    from: bet.from,
                    to: bet.to
                }
            })
        }

        return bets
    }

    async shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async getBets() {
        const bets = [];
    
        const allBets = await this.betsService.getAllBets(this.game.id);
        for (const bet of allBets) {
            const betSum = await this.betsService.getUserSumBet(bet.user.id, this.game.id);
    
            // Добавим проверку здесь
            let items;
            if (typeof bet.items === 'string') {
                items = JSON.parse(bet.items);
            } else {
                items = bet.items;
            }
    
            bets.unshift({
                id: bet.id,
                user: {
                    id: bet.user.id,
                    avatar: bet.user.avatar,
                    username: bet.user.username,
                    steamId: bet.user.steamId,
                    lvl: bet.user.lvl
                },
                bet: {
                    chance: ((betSum / this.game.bank) * 100).toFixed(2),
                    items: items,
                    sum: bet.sum,
                    from: bet.from,
                    to: bet.to
                }
            });
        }
    
        return bets;
    }
    
    @Cron(CronExpression.EVERY_MINUTE)
    async getSettings() {
        this.settings = await this.settingsService.getSettings();

        this.timeToStart = this.settings.game_time_to_start;

        if (this.game.status === 0) {
            this.time = this.settings.game_time_to_start;
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async resendItemsEvent() {
        const games = await this.gamesService.getGamesUnSendCommission();

        for (const game of games) {
            await this.resendItems(game.id);
        }
    }

    @Cron(CronExpression.EVERY_2_HOURS)
    async sendCommission() {
        if (this.settings.commission_trade_url !== null) {
            const items = await this.commissionItemsService.findByAll();

            const botItems = [];

            for (const item of items) {
                const botItem = JSON.parse(item.item);

                if (typeof botItems[item.bot_id.toString()] === 'undefined') {
                    botItems[item.bot_id.toString()] = [];
                }

                botItem.itemId = item.id;

                botItems[item.bot_id.toString()].push(botItem);
            }

            for (const botId in botItems) {
                const statusSend = await this.botsManagerService.sendCommissionItems(
                    parseInt(botId),
                    this.settings.commission_trade_url,
                    botItems[botId]
                );

                if (statusSend) {
                    for (const item of botItems[botId]) {
                        this.commissionItemsService.delete(parseInt(item.itemId));
                    }
                }
            }
        }
    }
}
