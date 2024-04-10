import {Body, Controller, Get, Param, Post, UseGuards} from "@nestjs/common";
import {BotsService} from "../bots/bots.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard";
import {BotsManagerService} from "../bots/bots-manager.service";

@Controller('admin/bots')
export class AdminBotsController {
    constructor(
        private readonly botsService: BotsService,
        private readonly botsManagerService: BotsManagerService
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('')
    async getBots() {
        return await this.botsService.findAll()
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('create')
    async createBot(@Body() body) {
        const bot = await this.botsService.create(body)

        await this.botsManagerService.addBot(bot)

        return true
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('delete/:id')
    async deleteBot(@Param('id') id) {
        return await this.botsService.delete(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('getById/:id')
    async getById(@Param('id') id) {
        return await this.botsService.findById(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('edit/:id')
    async editBot(@Param('id') id, @Body() body) {
        return await this.botsService.updateById(id, body)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('reboot/:id')
    async rebootBot(@Param('id') id) {
        return await this.botsManagerService.rebootBot(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('enable/:id')
    async enableBot(@Param('id') id, @Body() body) {
        return await this.botsManagerService.enableBot(id, body.enable)
    }
}