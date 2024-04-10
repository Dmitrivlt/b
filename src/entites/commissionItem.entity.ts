import {Entity, BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Column} from "typeorm";

@Entity('commission_items')
export class CommissionItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    bot_id: number

    @Column('json')
    item: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}