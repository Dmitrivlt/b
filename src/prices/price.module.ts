import {Module} from '@nestjs/common';
import { PricesModule } from "./prices.module";
import {ItemsModule} from "../items/items.module";

@Module({
    imports: [PricesModule],
    exports: [PricesModule],
    providers: [],
    controllers: []
})
export class PriceModule {}
