import { Module } from '@nestjs/common';
import { GamesModule } from "./games.module";

@Module({
    imports: [GamesModule],
    exports: [GamesModule],
    providers: [],
    controllers: []
})
export class GameModule {}
