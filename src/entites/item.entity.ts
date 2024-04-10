import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity('items')
export class ItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ charset: "utf8mb4", collation: "utf8mb4_unicode_ci" })
    market_hash_name: string

    @Column()
    icon_url: string

    @Column('double', { precision: 255, scale: 2 })
    price: number

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}