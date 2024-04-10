import {ApiProperty} from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DepositItemsDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly assetid: string;
}