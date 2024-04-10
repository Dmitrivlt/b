import {forwardRef, Logger, Module} from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameEntity } from "../entites/game.entity";
import { GameService } from "./game.service";
import { PriceModule } from "../prices/price.module";
import { BetEntity } from "../entites/bet.entity";
import { BetsService } from "./bets.service";
import { BotsModule } from "../bots/bots.module";
import { AppGateway } from "../app.gateway";
import {UsersModule} from "../users/users.module";
import {SettingsModule} from "../settings/settings.module";
import {CommissionItemsService} from "./commissionItems.service";
import {CommissionItemEntity} from "../entites/commissionItem.entity";
import {TradesModule} from "../trades/trades.module";
import {ItemsModule} from "../items/items.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity]),
    TypeOrmModule.forFeature([BetEntity]),
    TypeOrmModule.forFeature([CommissionItemEntity]),
    Logger,
    PriceModule,
    forwardRef(() => BotsModule),
    forwardRef(() => UsersModule),
    SettingsModule,
    TradesModule,
    ItemsModule
  ],
  exports: [TypeOrmModule, GamesService, BetsService, GameService, CommissionItemsService],
  providers: [GamesService, BetsService, CommissionItemsService, GameService, Logger, AppGateway],
  controllers: [GamesController]
})
export class GamesModule {}
