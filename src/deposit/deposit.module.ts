import {Module} from '@nestjs/common';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { BotModule } from "../bots/bot.module";
import {PriceModule} from "../prices/price.module";
import {SettingsModule} from "../settings/settings.module";

@Module({
  imports: [BotModule, PriceModule, SettingsModule],
  exports: [],
  controllers: [DepositController],
  providers: [DepositService]
})
export class DepositModule {}
