import {HttpModule, Module} from '@nestjs/common';
import { ItemsService } from './items.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ItemEntity} from "../entites/item.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity]),
    HttpModule
  ],
  exports: [
      TypeOrmModule,
      ItemsService
  ],
  providers: [ItemsService]
})
export class ItemsModule {}
