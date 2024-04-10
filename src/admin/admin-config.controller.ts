import {Body, Controller, Get, Post, UseGuards} from "@nestjs/common"
import {SettingsService} from "../settings/settings.service";
import {SettingEntity} from "../entites/setting.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard"
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard"

@Controller('admin/config')
export class AdminConfigController {
    constructor(
        private settingsService: SettingsService
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get()
    async getConfig(): Promise<SettingEntity> {
        return this.settingsService.getSettings()
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('save')
    async saveConfig(@Body() body): Promise<any> {
        await this.settingsService.updateById(body.id, body)

        return {
            success: true
        }
    }
}