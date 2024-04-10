import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import {SettingEntity} from "../entites/setting.entity";
import {EntityManager, Repository, UpdateResult} from "typeorm";

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SettingEntity)
        private readonly settingsRepository: Repository<SettingEntity>,
        private entityManager: EntityManager
    ) {
        this.entityManager.query('SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,\'ONLY_FULL_GROUP_BY\',\'\'));')
    }

    async getSettings(): Promise<SettingEntity> {
        let settings = await this.settingsRepository.findOne(1);

        if (!settings) {
            settings = await this.settingsRepository.save(
                await this.settingsRepository.create()
            );
        }

        return settings;
    }

    async updateById(settingId: number, data: any): Promise<UpdateResult> {
        return await this.settingsRepository.update(settingId, data);
    }
}
