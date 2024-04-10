import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {SettingEntity} from "../entites/setting.entity";
import {SettingsService} from "./settings.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([SettingEntity])
    ],
    exports: [
        TypeOrmModule,
        SettingsService
    ],
    providers: [
        SettingsService
    ]
})
export class SettingsModule {}
