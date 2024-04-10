import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity('bots')
export class BotEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column()
    password: string

    @Column()
    shared_secret: string

    @Column()
    identity_secret: string

    @Column()
    steamid: string

    @Column({ default: null })
    proxy: string

    @Column({ default: true })
    enabled: boolean

    @Column({ default: 'deposit' })
    type: string

    @Column({ default: null })
    trade_url: string

    @Column({ default: 0 })
    count_games: number

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
