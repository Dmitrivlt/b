import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TradeEntity} from "../entites/trade.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TradeEntity])],
  exports: [TypeOrmModule, TradesService],
  providers: [TradesService]
})
export class TradesModule {}
