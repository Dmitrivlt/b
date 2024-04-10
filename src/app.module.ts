import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BotsModule } from './bots/bots.module';
import { PriceModule } from './prices/price.module';
import { PricesModule } from './prices/prices.module';
import { DepositModule } from './deposit/deposit.module';
import { GamesModule } from './games/games.module';
import { GameModule } from './games/game.module';
import { AppGateway } from './app.gateway';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from 'nestjs-redis'
import { ScheduleModule } from '@nestjs/schedule';
import { TicketsModule } from './tickets/tickets.module';
import { GiveawaysModule } from './giveaways/giveaways.module';
import { AdminModule } from './admin/admin.module';
import { SettingsService } from './settings/settings.service';
import { SettingsModule } from './settings/settings.module';
import { ItemsModule } from './items/items.module';
import { TradesModule } from './trades/trades.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      "type": "mysql",
      "host": "localhost", // изменено с localhost на localhost
      "port": 3306,
      "username": "root",
      "password": "MNcYvB3Gte67pr6P",
      "database": "rusthot",
      "entities": ["./**/*.entity.js"],
      "synchronize": true,
      "autoLoadEntities": true
    }
    ),
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
    RedisModule.register({
      name: 'app',
      url: 'redis://localhost:6379'
    }),
    AuthModule,
    UsersModule,
    BotsModule,
    PriceModule,
    PricesModule,
    DepositModule,
    GamesModule,
    GameModule,
    ChatModule,
    ScheduleModule.forRoot(),
    TicketsModule,
    GiveawaysModule,
    AdminModule,
    SettingsModule,
    ItemsModule,
    TradesModule,
  ],
  controllers: [UsersController],
  providers: [
      UsersService,
      AppGateway,
      SettingsService,
  ],
})
export class AppModule {}
