import {CacheModule, Module} from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TicketEntity} from "../entites/ticket.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), CacheModule.register()],
  exports: [TypeOrmModule],
  controllers: [TicketsController],
  providers: [TicketsService]
})
export class TicketsModule {}
