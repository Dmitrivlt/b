import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class UserEntity extends BaseEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number

    @ApiProperty()
    @Column({ charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    username: string

    @ApiProperty()
    @Column()
    steamId: string

    @ApiProperty()
    @Column('longtext')
    avatar: string

    @ApiProperty()
    @Column('varchar', { default: null })
    trade_url: string

    @ApiProperty()
    @Column('int', { default: 0 })
    total_played: number

    @ApiProperty()
    @Column('int', { default: 0 })
    total_wins: number

    @ApiProperty()
    @Column('int', { default: 0 })
    total_items: number

    @ApiProperty()
    @Column('double', { precision: 255, scale: 2, default: 0.00 })
    total_win: number

    @ApiProperty()
    @Column('boolean', { default: false })
    is_ban_chat: boolean

    @ApiProperty()
    @Column('boolean', { default: false })
    is_fake: boolean

    @ApiProperty()
    @Column('int', { default: 1 })
    lvl: number

    @ApiProperty()
    @Column('int', { default: 0 })
    exp: number

    @ApiProperty()
    @Column('varchar', { default: 'user' })
    role: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
