import {CACHE_MANAGER, Controller, Get, HttpException, Inject, Post, Request, UseGuards} from '@nestjs/common';
import {ChatService} from "./chat.service";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import date from 'date-and-time';
import {AppGateway} from "../app.gateway";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {UsersService} from "../users/users.service";

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    private chat: any;

    constructor(
        private chatService: ChatService,
        @Inject(CACHE_MANAGER)
        private cacheManager,
        private appGateway: AppGateway,
        private usersService: UsersService
    ) {
        this.chat = [];
    }

    async onApplicationBootstrap() {
        this.chat = await this.chatService.getChat();
    }

    @ApiOperation({ summary: 'Последние сообщения из чата' })
    @Get('get')
    async getChat(): Promise<any> {
        return this.chat;
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Добавление сообщения в чат' })
    @ApiBearerAuth()
    @Post('send')
    async sendMessage(@Request() req): Promise<any> {
        let { message } = req.body;

        if (typeof await this.cacheManager.get(`send_message_${req.user.id}`) !== 'undefined') {
            throw new HttpException('Please, wait...', 400);
        }

        this.cacheManager.set(`send_message_${req.user.id}`, 1, 3);

        if (req.user.is_ban_chat) {
            throw new HttpException('You are blocked from chat', 400);
        }

        if (message.length < 3) {
            throw new HttpException('Minimum number of characters in a message: 3', 400);
        }

        if (message.length > 100) {
            throw new HttpException('Maximum number of characters in a message: 100', 400);
        }

        if (await this.validURL(message)) {
            throw new HttpException('There should be no links in the message', 400);
        }

        if ((req.user.role === 'admin' || req.user.role === 'moderator') && message === '/clear') {
            await this.chatService.clearChat();
            this.chat = [];
            this.appGateway.server.emit('chatClear');

            return {
                success: true
            }
        }

        message = await this.removeTags(message);

        const msg = {
            id: Math.random().toString(36).substring(2, 15)
                + Math.random().toString(36).substring(2, 15),
            user: {
                id: req.user.id,
                username: req.user.username,
                avatar: req.user.avatar,
                steamId: req.user.steamId,
                role: req.user.role,
                lvl: req.user.lvl
            },
            message: message,
            date: date.format(new Date(), 'HH:mm:ss')
        }

        await this.chatService.addMessage(msg);
        this.chat.push(msg);

        this.appGateway.server.emit('chatNewMessage', msg);

        return {
            success: true
        }
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Удаление сообщения' })
    @ApiBearerAuth()
    @Post('delete')
    async delete(@Request() req): Promise<any> {
        const { id } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            throw new HttpException('Not enough rights', 400);
        }

        for (const message of this.chat) {
            if (message.id === id) {
                await this.chatService.deleteMessage(message);

                const index = this.chat.findIndex(x => x.id === id);

                if (index > -1) {
                    this.chat.splice(index, 1);
                }

                this.appGateway.server.emit('deleteMessage', id);

                return {
                    success: true
                }
            }
        }

        throw new HttpException('Message not found', 400);
    }

    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Блокировка чата для пользователя' })
    @ApiBearerAuth()
    @Post('ban')
    async ban(@Request() req): Promise<any> {
        const { id } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            throw new HttpException('Not enough rights', 400);
        }

        const user = await this.usersService.findById(id);

        if (!user) {
            throw new HttpException('User is not found', 400);
        }

        if (user.is_ban_chat) {
            throw new HttpException('User is already blocked', 400);
        }

        user.is_ban_chat = true;
        await this.usersService.update(user);

        return {
            success: true
        }
    }

    async validURL(str) {
        return str.match('(http|ftp|https)://([\\w_-]+(?:(?:\\.[\\w_-]+)+))([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?');
    }

    async removeTags(str) {
        if ((str === null) || (str === '')) return false;
        str = str.toString();
        return str.replace(/(<([^>]+)>)/ig, '');
    }
}
