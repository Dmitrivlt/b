import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne, JoinColumn
} from 'typeorm';
import {UserEntity} from "./user.entity";

@Entity('tickets')
export class TicketEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user_id: number

    @Column({ charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    subject: string

    @Column('json')
    messages: string

    @Column('varchar')
    game_number: any

    @Column('boolean', { default: 1 })
    last_user: boolean

    @Column('boolean', { default: 0 })
    is_closed: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: UserEntity
}