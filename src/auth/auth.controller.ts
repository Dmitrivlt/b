import {Controller, Get, UseGuards, Request, Response} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {AuthService} from "./auth.service";
import {
    ApiTags, ApiOperation
} from '@nestjs/swagger';
import { Constants } from '../constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {
    }

    @ApiOperation({ summary: 'Авторизация пользователя через STEAM' })
    @UseGuards(AuthGuard('steam'))
    @Get('steam')
    async login() {
        return 'Redirected';
    }

    @ApiOperation({ summary: 'Сюда вернет пользователя после авторизации' })
    @UseGuards(AuthGuard('steam'))
    @Get('steam/return')
    async handler(@Request() req, @Response() res) {
        const accessToken = await this.authService.logIn(req.user);

        res.redirect(`${Constants.frontend_url}/auth?token=${accessToken}`);

        return accessToken;
    }
}
