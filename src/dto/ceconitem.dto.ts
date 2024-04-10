import {IsEmpty, IsNotEmpty, IsNumber, IsString} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CEconItemDto {
    @ApiProperty()
    @IsEmpty()
    @IsNumber()
    readonly bot_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly assetid: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly market_hash_name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly icon_url: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    readonly price: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    readonly background_color: string;
}
