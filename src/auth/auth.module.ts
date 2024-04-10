import { Module } from '@nestjs/common';
import { PassportModule } from "@nestjs/passport";
import { AuthService } from './auth.service';
import { UsersModule } from "../users/users.module";
import { SteamStrategy } from './steam.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from "./jwt.strategy";
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [
      UsersModule,
      PassportModule.register({ session: true }),
      JwtModule.register({
        secret: jwtConstants.secret,
        signOptions: { expiresIn: '7d' },
      }),
  ],
  providers: [AuthService, SteamStrategy, JwtStrategy, LocalStrategy, SessionSerializer],
  controllers: [AuthController]
})
export class AuthModule {}
