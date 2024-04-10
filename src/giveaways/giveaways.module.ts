import {Logger, Module} from '@nestjs/common';
import { GiveawaysService } from './giveaways.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {GiveawayEntity} from "../entites/giveaway.entity";
import {GiveawayBetEntity} from "../entites/giveawayBet.entity";
import { GiveawaysController } from './giveaways.controller';
import {AppGateway} from "../app.gateway";
import {GamesModule} from "../games/games.module";
import {SettingsModule} from "../settings/settings.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GiveawayEntity]),
    TypeOrmModule.forFeature([GiveawayBetEntity]),
    Logger,
    GamesModule,
    SettingsModule
  ],
  exports: [TypeOrmModule, GiveawaysService],
  providers: [GiveawaysService, Logger, AppGateway],
  controllers: [GiveawaysController]
})
export class GiveawaysModule {}
