import {HttpService, Injectable} from '@nestjs/common';
import {Constants} from "../constants";
import {InjectRepository} from "@nestjs/typeorm";
import {ItemEntity} from "../entites/item.entity";
import {Repository} from "typeorm";
import {
    makeLimiterFromLimiters,
    makeLimiterWorkPerSecond,
    makeLimiterWorkPerTime,
    RateLimitQueue,
} from "../utils/limiter"
import twoFactor from 'node-2fa';
import {Cron, CronExpression} from "@nestjs/schedule";

@Injectable()
export class ItemsService {
    public prices: any;
    public plannedUpdatePrices: boolean

    protected readonly itemLoaderQueue = new RateLimitQueue(makeLimiterFromLimiters([
        makeLimiterWorkPerSecond(1),
        makeLimiterWorkPerTime(5, 1000 * 60),
        makeLimiterWorkPerTime(15, 1000 * 60 * 5),
    ]))

    constructor(
        @InjectRepository(ItemEntity)
        private readonly itemRepository: Repository<ItemEntity>,
        private readonly httpService: HttpService
    ) {
        this.plannedUpdatePrices = false
    }

    async onApplicationBootstrap() {
        await this.checkItems();
        await this.getPrices();
    }

    async checkItems() {
        const itemsCount = await this.itemRepository.count();

        if (itemsCount === 0) {
              this.loadItems();

            return;
        }

        return;
    }

    async loadItems() {
        try {
            for await (const marketItem of this.generatorSteamMarketItems()) {
                try {
                    const price = marketItem.sell_price / 100

                    const item = marketItem.asset_description

                    const itemBD = await this.itemRepository.findOne({
                        market_hash_name: item.market_hash_name
                    })

                    if (itemBD) {
                        itemBD.price = price

                        await this.itemRepository.save(itemBD)
                    } else {
                        if (item.icon_url_large === null) {
                            continue
                        }

                        if (price < 0.01) {
                            continue
                        }

                        await this.itemRepository.save(
                            this.itemRepository.create({
                                market_hash_name: item.market_hash_name,
                                icon_url: item.icon_url_large === '' ? item.icon_url : item.icon_url_large,
                                price
                            })
                        )
                    }
                } catch (e) {
                    console.log(e)
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    public async loadItemsPage(page = 0, perPage = 1000) {
        perPage = Math.min(100, perPage)

        const {data} = await this.httpService.get(
            `https://steamcommunity.com/market/search/render`,
            {
                params: {
                    query: '',
                    start: page * perPage,
                    count: perPage,
                    search_descriptions: 0,
                    norender: 1,
                    sort_column: 'quantity',
                    sort_dir: 'desc',
                    appid: Constants.appId,
                },
            },
        ).toPromise()

        return data
    }

    public async* generatorSteamMarketItems(startPage = 0) {
        let currentPage = startPage
        const loaderBreakRule = (page) =>
            page.start >= page.total_count ||
            page.results.some(i => i.sell_listings < 0.01)

        while (true) {
            const page = await this.itemLoaderQueue.add(() => this.loadItemsPage(currentPage))

            for (const item of page.results)
                if (item.sell_listings > 0.01)
                    yield item

            if (loaderBreakRule(page)) break
            currentPage++
        }
    }

    async generateTwoFactor() {
        const token = twoFactor.generateToken(Constants.bitskins.two_fa);

        return token.token;
    }

    async findAll() {
        return await this.itemRepository.find();
    }

    async findById(itemId: number) {
        return await this.itemRepository.findOne(itemId);
    }

    async update(itemId: number, data: any) {
        return await this.itemRepository.update(itemId, data);
    }

    async save(item: ItemEntity) {
        return await this.itemRepository.save(item)
    }

    async findItemsInInventory(marketHashName = '', page: number, limit: number): Promise<any> {
        const queryBuilder = this.itemRepository.createQueryBuilder()
        queryBuilder.where(
            `market_hash_name LIKE '%${marketHashName}%'`
        )
        queryBuilder.limit(limit)
        queryBuilder.offset(page)

        return queryBuilder.getMany()
    }

    async getAllItems(data): Promise<any> {
        const queryBuilder = this.itemRepository.createQueryBuilder()
        queryBuilder.orderBy(`${data.columnName}`, data.columnSortOrder.toUpperCase())
        queryBuilder.where(
            `market_hash_name LIKE '%${data.searchValue}%'`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountItems(): Promise<number> {
        const sum = await this.itemRepository.createQueryBuilder()
            .select('COUNT(id)', 'cnt')
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }

    async findByRandomSum(min: number, max: number): Promise<ItemEntity> {
        return await this.itemRepository.createQueryBuilder()
            .where(`price >= ${min} AND price <= ${max}`)
            .orderBy('RAND()')
            .getOne()
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async updatePrices() {
        await this.loadItems()
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async getPrices() {
        this.prices = [];

        const items = await this.itemRepository.find();

        for (const item of items) {
            this.prices[item.market_hash_name] = item.price;
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async planeUpdatePrices() {
        if (this.plannedUpdatePrices) {
            this.plannedUpdatePrices = false

            await this.updatePrices()
        }
    }
}
