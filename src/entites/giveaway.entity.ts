import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {UserEntity} from "./user.entity";
import {ItemEntity} from "./item.entity";

@Entity('giveaways')
export class GiveawayEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int', { default: 0 })
    users: number

    @Column()
    item_id: number

    @Column('double', { precision: 255, scale: 2, default: null })
    winner_chance: number

    @Column('int', { default: null })
    winner_id: number

    @Column('datetime')
    end_time: any

    @Column('boolean', { default: false })
    is_finished: boolean

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'winner_id', referencedColumnName: 'id'})
    winner: UserEntity

    @ManyToOne(type => ItemEntity)
    @JoinColumn({name: 'item_id', referencedColumnName: 'id'})
    item: ItemEntity

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}
