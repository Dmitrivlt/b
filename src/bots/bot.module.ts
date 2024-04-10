import {Module} from '@nestjs/common';
import { BotsModule } from "./bots.module";

@Module({
    imports: [BotsModule],
    exports: [BotsModule],
    providers: [],
    controllers: []
})
export class BotModule {}
