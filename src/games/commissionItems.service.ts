import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository, UpdateResult} from "typeorm";
import {CommissionItemEntity} from "../entites/commissionItem.entity";

@Injectable()
export class CommissionItemsService {
    constructor(
        @InjectRepository(CommissionItemEntity)
        private readonly commissionItemRepository: Repository<CommissionItemEntity>
    ) {
    }

    async findByAll(): Promise<CommissionItemEntity[]> {
        return await this.commissionItemRepository.find();
    }

    async findById(id: any): Promise<CommissionItemEntity> {
        return await this.commissionItemRepository.findOne(id);
    }

    async create(data: any): Promise<CommissionItemEntity> {
        const item = await this.commissionItemRepository.create();
        item.bot_id = data.botId;
        item.item = JSON.stringify(data.item);

        return await this.commissionItemRepository.save(item);
    }

    async updateById(id: number, data: any): Promise<UpdateResult> {
        return await this.commissionItemRepository.update(id, data);
    }

    async delete(id: any): Promise<any> {
        return await this.commissionItemRepository.delete(id);
    }
}