import {Logger} from "@nestjs/common";
import SteamUser from 'steam-user';
import SteamCommunity from 'steamcommunity';
import SteamTotp from 'steam-totp';
import TradeOfferManager from 'steam-tradeoffer-manager';
import request from 'request'
import {CEconItemDto} from "../dto/ceconitem.dto";
import {UserEntity} from "../entites/user.entity";
import {GameService} from "../games/game.service";
import {UsersService} from "../users/users.service";
import {Constants} from "../constants";
import {TradesService} from "../trades/trades.service";
import {uniqueNamesGenerator, adjectives, colors} from "unique-names-generator";
import {BotsService} from "./bots.service";

export class Bot {
    private readonly client;
    private manager;
    private community;
    public readonly id;

    constructor(
        readonly data: any,
        private readonly logger: Logger,
        private readonly gameService: GameService,
        private readonly usersService: UsersService,
        private readonly tradeService: TradesService,
        private readonly botsService: BotsService
    ) {
        this.id = data.id;

        this.client = new SteamUser();
        this.manager = new TradeOfferManager({
            steam: this.client,
            language: 'en',
            pollInterval: 1000
        });

        if (this.data.proxy !== null && this.data.proxy.length > 0) {
            this.community = new SteamCommunity({
                request: request.defaults({'proxy': this.data.proxy})
            });
        } else {
            this.community = new SteamCommunity()
        }

        this.initEvents();
        this.logIn();
    }

    async logIn() {
        this.client.logOn({
            accountName: this.data.username,
            password: this.data.password,
            twoFactorCode: SteamTotp.getAuthCode(this.data.shared_secret),
        });
    }

    async initEvents() {
        this.client.on('loggedOn', () => {
            this.logger.debug(`[Бот ${this.data.username}] Успешная авторизация`)
        });

        this.client.on('error', (e) => {
            this.logger.error(`[Бот ${this.data.username}] Не смог авторизоваться по причине ${e}`)
        });

        this.client.on('webSession', async (sessionID, cookies) => {
            try {
                this.manager.setCookies(cookies)

                this.community.setCookies(cookies);
                this.community.startConfirmationChecker(10000, this.data.identity_secret);

                if (this.data.type === 'bot' || this.data.type === 'bonus') {
                    this.community.getSteamUser(this.client.steamID, async (err, user) => {
                        const userDB = await this.usersService.findBySteamId(this.client.steamID.getSteamID64())

                        if (!userDB) {
                            if (this.data.type === 'bot') {
                                this.usersService.create({
                                    username: user.name,
                                    steamId: this.client.steamID.getSteamID64(),
                                    avatar: user.getAvatarURL('full'),
                                    role: 'admin'
                                })
                            } else if (this.data.type === 'bonus') {
                                this.usersService.create({
                                    username: 'Бонусная ставка',
                                    steamId: this.client.steamID.getSteamID64(),
                                    avatar: 'https://cdn.icon-icons.com/icons2/554/PNG/512/present_bonus_icon-icons.com_53587.png',
                                    role: 'admin'
                                })
                            }
                        }
                    })
                }
            } catch (e) {
                this.logger.error(`[Бот ${this.data.username}] Не смог получить куки по причине ${e}`)
            }
        });

        this.manager.on('sentOfferChanged', async (offer) => {
            try {
                if (offer.state !== 2) {
                    const trade = await this.tradeService.findByOfferId(offer.id)

                    if (trade) {
                        trade.status = TradeOfferManager.ETradeOfferState[offer.state]

                        await this.tradeService.update(trade)
                    }
                }

                if (offer.message.indexOf('Your deposit') > -1 && offer.state === 3) {
                    const user = await this.usersService.findBySteamId(offer.partner.getSteamID64());
                    const items = offer.itemsToReceive;

                    await this.gameService.addBet(this.data.id, user, items, offer.id);
                }
            } catch (e) {
                this.logger.debug(`[Бот ${this.data.username}] Обмен #${offer.id} не смогли обработать: ${e.message}`);
            }
        });

        this.manager.on('newOffer', async (offer) => {
            const bot = await this.botsService.findBySteamId(offer.partner.getSteamID64());

            if (bot) {
                offer.accept((err, status) => {
                    this.logger.debug(`[Бот ${this.data.username}] Принят обмен от бота ${bot.username} (${bot.steamid})`);

                    if (status == "pending") {
                        this.community.acceptConfirmationForObject(this.data.identity_secret, offer.id, () => {
                            this.logger.debug(`[Бот ${this.data.username}] Подтвержден обмен от бота ${bot.username} (${bot.steamid})`);
                        });
                    }
                });

                return
            }

            const user = await this.usersService.findBySteamId(offer.partner.getSteamID64());

            if ((user && user.role === 'admin') || (offer.itemsToReceive.length > 0 && offer.itemsToGive.length === 0)) {
                offer.accept((err, status) => {
                    this.logger.debug(`[Бот ${this.data.username}] Принят обмен от админа ${bot.username} (${bot.steamid})`);

                    if (status == "pending") {
                        this.community.acceptConfirmationForObject(this.data.identity_secret, offer.id, () => {
                            this.logger.debug(`[Бот ${this.data.username}] Подтвержден обмен от админа ${bot.username} (${bot.steamid})`);
                        });
                    }
                });

                return
            }
        });

        this.community.on('sessionExpired', () => {
            this.logger.debug(`[Бот ${this.data.username}] Умерла сессия`)

            if (this.client.steamID === null) {
                this.logIn();
            } else {
                this.client.webLogOn();
            }
        });
    }

    async getUserInventory(steamId: string): Promise<any> {
        return new Promise((res, rej) => {
            this.manager.getUserInventoryContents(steamId, Constants.appId, 2, true, (err, inventory) => {
                if (err) {
                    return rej(err);
                }

                return res(inventory);
            });
        });
    }

    async getSteamIdByTradeUrl(url: string): Promise<string> {
        return new Promise((res) => {
            try {
                const offer = this.manager.createOffer(url);

                return res(offer.partner.getSteamID64());
            } catch (e) {
                return res('');
            }
        });
    }

    async createOffer(
        user: UserEntity,
        items: CEconItemDto[],
        type = 'deposit'
    ): Promise<string> {
        return new Promise(async (res, rej) => {
            const theirItems = [];

            for (const item of Object.keys(items)) {
                theirItems.push({
                    assetid: items[item].assetid,
                    appid: Constants.appId,
                    contextid: 2,
                    amount: 1,
                    item: items[item]
                });
            }

            const offer = this.manager.createOffer(user.trade_url);
            offer.addTheirItems(theirItems);
            offer.setMessage('Your deposit');

            const trade = await this.tradeService.createTrade({
                user_id: type === 'deposit' ? user.id : null,
                game_id: null,
                offer_id: null,
                items: JSON.stringify(theirItems),
                type: 'deposit',
                status: null
            })

            offer.send((err) => {
                if (err) {
                    trade.status = err.message
                    this.tradeService.update(trade)

                    return rej(err);
                }

                trade.status = 'Active'
                trade.order_id = offer.id
                this.tradeService.update(trade)

                return res(offer.id);
            });
        });
    }

    async sendItems(
        user: UserEntity,
        items: CEconItemDto[],
        message: string,
        gameId: number
    ) {
        const trade = await this.tradeService.createTrade({
            user_id: user.id,
            game_id: gameId,
            offer_id: null,
            items: null,
            type: 'withdraw',
            status: null
        })

        return new Promise((res) => {
            try {
                this.manager.getInventoryContents(Constants.appId, 2, true, async (err, inventory) => {
                    if (err) {
                        this.logger.error(
                            `[Бот ${this.data.username}] Ошибка отправки выигрыша пользователю ${user.username} (${user.steamId}). Причина ${err.message}`
                        )

                        return res(false);
                    }

                    const offer = this.manager.createOffer(user.trade_url);
                    const myItems = [];
                    const existsAssetId = [];

                    for (const item of items) {
                        for (const itemInventory of inventory) {
                            if (item.market_hash_name === itemInventory.market_hash_name && typeof existsAssetId[itemInventory.assetid] === 'undefined') {
                                itemInventory.price = item.price

                                myItems.push({
                                    assetid: itemInventory.assetid,
                                    appid: Constants.appId,
                                    contextid: 2,
                                    amount: 1,
                                    item: itemInventory
                                });
                                existsAssetId[itemInventory.assetid] = 1;
                            }
                        }
                    }

                    offer.addMyItems(myItems);
                    offer.setMessage(message);

                    trade.order_id = offer.id
                    trade.items = JSON.stringify(myItems)
                    this.tradeService.update(trade)

                    offer.send((err, status) => {
                        if (err) {
                            this.logger.error(
                                `[Бот ${this.data.username}] Ошибка отправки выигрыша пользователю ${user.username} (${user.steamId}). Причина ${err.message}`
                            )

                            trade.status = err.message
                            this.tradeService.update(trade)

                            return res(false);
                        }

                        this.logger.debug(`[Бот ${this.data.username}] Выигрыш отправлен пользователю ${user.username} (${user.steamId})`);

                        if (status === 'pending') {
                            this.community.acceptConfirmationForObject(this.data.identity_secret, offer.id, () => {
                                this.logger.debug(`[Бот ${this.data.username}] Выигрыш пользователю ${user.username} (${user.steamId}) подтвержден`);
                            });
                        }

                        trade.status = 'Active'
                        trade.order_id = offer.id
                        this.tradeService.update(trade)

                        return res(true);
                    });
                });
            } catch (e) {
                this.logger.error(
                    `[Бот ${this.data.username}] Ошибка отправки выигрыша пользователю ${user.username} (${user.steamId}). Причина ${e.message}`
                )

                return res(false);
            }
        });
    }

    async sendCommissionItems(
        trade_url: string,
        items: any
    ) {
        return new Promise((res, rej) => {
            try {
                this.manager.getInventoryContents(Constants.appId, 2, true, async (err, inventory) => {
                    if (err) {
                        this.logger.error(
                            `[Бот ${this.data.username}] Ошибка отправки комиссии. Причина ${err.message}`
                        )

                        return res(false);
                    }

                    const offer = this.manager.createOffer(trade_url);
                    const myItems = [];
                    const existsAssetId = [];

                    for (const item of items) {
                        for (const itemInventory of inventory) {
                            if (item.market_hash_name === itemInventory.market_hash_name && typeof existsAssetId[itemInventory.assetid] === 'undefined') {
                                myItems.push({
                                    assetid: itemInventory.assetid,
                                    appid: Constants.appId,
                                    contextid: 2,
                                    amount: 1,
                                });
                                existsAssetId[itemInventory.assetid] = 1;
                            }
                        }
                    }

                    offer.addMyItems(myItems);

                    offer.send((err, status) => {
                        if (err) {
                            this.logger.error(
                                `[Бот ${this.data.username}] Ошибка отправки комиссии. Причина ${err.message}`
                            )

                            return res(false);
                        }

                        this.logger.debug(`[Бот ${this.data.username}] Комиссия отправлена`);

                        if (status === 'pending') {
                            this.community.acceptConfirmationForObject(this.data.identity_secret, offer.id, () => {
                                this.logger.debug(`[Бот ${this.data.username}] Отправка комиссии подтверждена`);
                            });
                        }

                        return res(true);
                    });
                });
            } catch (e) {
                this.logger.error(
                    `[Бот ${this.data.username}] Ошибка отправки комиссии. Причина ${e.message}`
                )

                return res(false);
            }
        });
    }

    async updateInfo() {
        this.client.setPersona(0, uniqueNamesGenerator(
            {
                dictionaries: [adjectives, colors],
                separator: ' '
            })
        )

        this.community.uploadAvatar(`https://i.pravatar.cc/150?u=${this.client.steamID.getSteamID64()}`)

        setTimeout(() => {
            this.community.clearPersonaNameHistory()
        }, 1000)
    }
}