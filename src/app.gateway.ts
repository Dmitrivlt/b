import { Socket, Server } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage,
} from '@nestjs/websockets';
import { Constants } from "./constants";
import {SettingsService} from "./settings/settings.service";
import {SettingEntity} from "./entites/setting.entity";
import {Cron, CronExpression} from "@nestjs/schedule";
import randomInt from 'random-int';

@WebSocketGateway(3001, { origin: Constants.frontend_url, transports:  ['websocket'] })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  realUsers: any;
  fakeOnline: number;
  settings: SettingEntity;
  onlineUsers: any;

  constructor(
      private readonly settingsService: SettingsService
  ) {
    this.realUsers = {};
    this.onlineUsers = {};
  }

  async onApplicationBootstrap() {
    this.settings = await this.settingsService.getSettings();
    this.fakeOnline = randomInt(0, this.settings.fake_online);
  }

  handleDisconnect(client: Socket) {
    if (typeof this.realUsers[client.request.connection.remoteAddress] !== 'undefined') {
      delete this.realUsers[client.request.connection.remoteAddress]
    }

    this.updateOnline();
  }

  handleConnection(client: Socket) {
    if (typeof this.realUsers[client.request.connection.remoteAddress] === 'undefined') {
      this.realUsers[client.request.connection.remoteAddress] = 1;
    }

    this.updateOnline();
  }

  @SubscribeMessage('login')
  handleLogin(client: Socket, userId: number): void {
    const currentDate = new Date();
    const newDate = new Date(currentDate.getTime() + 5 * 60000);

    if (typeof this.onlineUsers[userId] === 'undefined') {
      this.onlineUsers[userId] = newDate;
    }
  }


  updateOnline() {
    this.server.emit('online', Object.keys(this.realUsers).length + this.fakeOnline);
  }

  sendNotify(steamId: string, type: string, text: string) {
    this.server.emit('notify', {
      steamId,
      type,
      text
    })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateSettings() {
    this.settings = await this.settingsService.getSettings();
    this.fakeOnline = randomInt(0, this.settings.fake_online);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateOnlineUsers() {
    for (const userId in this.onlineUsers) {
      const currentDate = this.onlineUsers[userId];

      if (new Date(currentDate) < new Date()) {
        delete this.onlineUsers[userId];
      }
    }
  }
}
