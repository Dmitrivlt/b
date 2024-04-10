import {Injectable, Logger} from '@nestjs/common';
import axios from 'axios';
import {Constants} from "../constants";
import {ItemsService} from "../items/items.service";

@Injectable()
export class PricesService {
    constructor(
        private readonly logger: Logger,
        private readonly itemService: ItemsService
    ) {
        this.logger.setContext('Цены');
    }

    async getSteamItemByClassID(classId: string): Promise<any> {
        return new Promise((res) => {
            axios.get(`http://api.steampowered.com/ISteamEconomy/GetAssetClassInfo/v0001/?key=${Constants.steam.api}&appid=${Constants.appId}&class_count=1&classid0=${classId}`)
                .then(async (result) => {
                    const data = result.data.result;

                    if (!data.success) {
                        return res(null);
                    }

                    const item = data[classId.toString()];

                    return res({
                        market_hash_name: item.market_hash_name,
                        icon_url: item.icon_url_large,
                        price: await this.getPriceByMarketHashName(item.market_hash_name)
                    });
                })
                .catch(() => {
                    return res(null);
                })
        });
    }

    async getPriceByMarketHashName(marketHashName: string): Promise<number> {
        try {
            return parseFloat(this.itemService.prices[marketHashName]);
        } catch (e) {
            return 0;
        }
    }
}
