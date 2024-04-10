import {Logger, Module} from '@nestjs/common';
import { PricesService } from './prices.service';
import {ItemsModule} from "../items/items.module";

@Module({
  imports: [
    Logger,
    ItemsModule
  ],
  exports: [PricesService],
  providers: [PricesService, Logger],
  controllers: []
})
export class PricesModule {}
