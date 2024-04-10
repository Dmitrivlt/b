import {Logger, Module} from '@nestjs/common';
import {AdminController} from './admin.controller';
import {GameModule} from "../games/game.module";
import {GamesService} from "../games/games.service";
import {UsersModule} from "../users/users.module";
import {UsersService} from "../users/users.service";
import {BetsService} from "../games/bets.service";
import {TicketsModule} from "../tickets/tickets.module";
import {TicketsService} from "../tickets/tickets.service";
import {GiveawaysModule} from "../giveaways/giveaways.module";
import {GiveawaysService} from "../giveaways/giveaways.service";
import {PriceModule} from "../prices/price.module";
import {BotModule} from "../bots/bot.module";
import {SettingsModule} from "../settings/settings.module";
import {ItemsModule} from "../items/items.module";
import {AppGateway} from "../app.gateway";
import {Utils} from "../utils";
import {AdminGamesController} from "./admin-games.controller";
import {TradesModule} from "../trades/trades.module";
import {AdminGiveawaysController} from "./admin-giveaways.controller";
import {AdminTicketsController} from "./admin-tickets.controller";
import {AdminBotsController} from "./admin-bots.controller";
import {AdminItemsController} from "./admin-items.controller";
import {AdminComissionController} from "./admin-comission.controller";
import {AdminConfigController} from "./admin-config.controller";

@Module({
    imports: [TradesModule, GameModule, UsersModule, TicketsModule, GiveawaysModule, PriceModule, BotModule, Logger, SettingsModule, ItemsModule],
    providers: [Utils, GamesService, UsersService, BetsService, TicketsService, GiveawaysService, Logger, AppGateway],
    controllers: [AdminController, AdminGamesController, AdminGiveawaysController, AdminTicketsController, AdminBotsController, AdminItemsController, AdminComissionController, AdminConfigController]
})
export class AdminModule {
}
