import { Strategy } from 'passport-steam';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Constants } from "../constants";

@Injectable()
export class SteamStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            returnURL: `${Constants.backend_url}/api/auth/steam/return`,
            realm: `${Constants.backend_url}`,
            apiKey: Constants.steam.api
        });
    }

    async validate(identifier, profile): Promise<any> {
        return await this.authService.validateUser(profile);
    }
}
