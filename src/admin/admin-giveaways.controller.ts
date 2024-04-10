import {Body, Controller, Get, HttpException, Param, Post, Query, UseGuards} from "@nestjs/common"
import {GiveawaysService} from "../giveaways/giveaways.service"
import {JwtAuthGuard} from "../auth/jwt-auth.guard"
import {AdminOrModeratorGuard} from "../auth/admin-or-moderator.guard"
import {Utils} from "../utils"
import {UsersService} from "../users/users.service";

@Controller('admin/giveaways')
export class AdminGiveawaysController {
    constructor(
        private giveawayService: GiveawaysService,
        private utils: Utils,
        private usersService: UsersService
    ) {
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get()
    async getGiveaways(@Query() query): Promise<any> {
        const { draw, row, length, columnName, columnSortOrder, searchValue } = await this.utils.parseDataTableQuery(query)

        const giveaways = await this.giveawayService.getGiveaways(
            {
                columnName,
                columnSortOrder,
                searchValue,
                row,
                length
            })

        const giveawaysAll = await this.giveawayService.getCountAllGiveaways()

        return {
            draw,
            data: giveaways,
            recordsTotal: giveawaysAll,
            recordsFiltered: giveawaysAll
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('/:id/del')
    async deleteGiveaway(@Param('id') id): Promise<any> {
        await this.giveawayService.deleteById(id)

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Get('/:id/getUsers')
    async getUsers(@Param('id') id): Promise<any> {
        return await this.giveawayService.getBetsUsersInGiveaway(id)
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('/deleteUser/:id')
    async deleteUser(@Param('id') id): Promise<any> {
        const giveawayBet = await this.giveawayService.getBetById(id)

        await this.giveawayService.deleteBetById(id)

        giveawayBet.giveaway.users -= 1
        await this.giveawayService.updateGiveaway(giveawayBet.giveaway)

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('create')
    async createGiveaway(@Body() body): Promise<any> {
        await this.giveawayService.createGiveaway(body)

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard, AdminOrModeratorGuard)
    @Post('/addUser/:id')
    async addUser(@Param('id') id, @Body() body) {
        const user = await this.usersService.findById(id)
        const giveaway = await this.giveawayService.getGiveawayById(body.giveaway_id)

        if (!giveaway || giveaway.is_finished) {
            throw new HttpException('Розыгрыш окончен', 400)
        }

        if (await this.giveawayService.getBetUserInGiveaway(giveaway.id, user.id)) {
            throw new HttpException('Пользователь уже участвует в розыгрыше', 400);
        }

        await this.giveawayService.newGiveawayBet(giveaway.id, user.id);

        giveaway.users += 1;

        await this.giveawayService.updateGiveaway(giveaway);

        return {
            success: true
        }
    }
}