import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Constants } from "../constants";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    async validate(username: string, password: string): Promise<any> {
        if (username === Constants.admin.username && password === Constants.admin.password) {
            return {
                username: Constants.admin.username
            };
        }

        throw new UnauthorizedException();
    }
}