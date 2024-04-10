import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity, JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {UserEntity} from "./user.entity";

@Entity('games')
export class GameEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('double', { precision: 255, scale: 2, default: 0.00 })
    bank: number

    @Column('int', { default: 0 })
    users: number

    @Column('int', { default: 0 })
    items: number

    @Column('int', { nullable: true })
    winner_id: number

    @Column('json', { nullable: true })
    commission_items: string

    @Column('double', { precision: 255, scale: 2, default: 0.00 })
    commission_bank: number

    @Column('json', { nullable: true })
    win_items: string

    @Column('double', { precision: 255, scale: 2, default: 0.00 })
    chance: number

    @Column('int', { default: 0 })
    status: number

    @Column()
    round_number: string

    @Column({ default: null })
    win_ticket: number

    @Column({ default: null })
    all_tickets: number

    @Column()
    hash: string

    @Column('json', { nullable: true })
    error_send_bot_ids: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'winner_id', referencedColumnName: 'id'})
    user: UserEntity
}