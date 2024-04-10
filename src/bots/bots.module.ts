import { Logger, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsService } from './bots.service';
import { BotEntity } from "../entites/bot.entity";
import { BotsManagerService } from "./bots-manager.service";
import { UsersModule } from "../users/users.module";
import {GameModule} from "../games/game.module";
import {TradesModule} from "../trades/trades.module";

@Module({
  imports: [
      TypeOrmModule.forFeature([BotEntity]),
      Logger,
      forwardRef(() => UsersModule),
      forwardRef(() => GameModule),
      TradesModule
  ],
  exports: [TypeOrmModule, BotsService, BotsManagerService],
  providers: [BotsService, BotsManagerService, Logger],
  controllers: []
})
export class BotsModule {}
