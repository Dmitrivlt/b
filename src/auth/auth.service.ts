import { Injectable } from '@nestjs/common';
import { UsersService } from "../users/users.service";
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from "../entites/user.entity";

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async validateUser(profile: any): Promise<any> {
        return await this.usersService.findOrCreate(profile._json);
    }

    async logIn(user: UserEntity): Promise<string> {
        const payload = {
            sub: user.id,
            steamId: user.steamId
        }

        return this.jwtService.sign(payload);
    }
}
