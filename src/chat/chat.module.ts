import {CacheModule, Module} from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {AppGateway} from "../app.gateway";
import {UsersModule} from "../users/users.module";
import {SettingsModule} from "../settings/settings.module";

@Module({
  imports: [CacheModule.register(), UsersModule, SettingsModule],
  controllers: [ChatController],
  providers: [ChatService, AppGateway]
})
export class ChatModule {}
