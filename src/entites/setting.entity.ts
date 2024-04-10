import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

@Entity('settings')
export class SettingEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('int', { default: 2 })
    game_users_to_start: number

    @Column('int', { default: 90 })
    game_time_to_start: number

    @Column('int', { default: 10 })
    game_fee: number

    @Column('double', { precision: 255, scale: 2, default: 0.01 })
    game_min_bet: number

    @Column('int', { default: 0 })
    fake_online: number

    @Column('varchar', { default: null })
    commission_trade_url: string

    @Column('int', { default: 10 })
    game_min_fake_bet: number

    @Column('int', { default: 50 })
    game_max_fake_bet: number

    @Column('int', { default: 5 })
    game_min_fake_users: number

    @Column('int', { default: 10 })
    game_max_fake_users: number

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
