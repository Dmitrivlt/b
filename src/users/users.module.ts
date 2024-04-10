import {CacheModule, forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entites/user.entity';
import { UsersService } from './users.service';
import { UsersController } from "./users.controller";
import { BotModule } from "../bots/bot.module";
import { PriceModule } from "../prices/price.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        forwardRef(() => BotModule),
        PriceModule,
        CacheModule.register()
    ],
    exports: [TypeOrmModule, UsersService],
    providers: [
        UsersService
    ],
    controllers: [
        UsersController
    ]
})
export class UsersModule {}
