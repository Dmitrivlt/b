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
import {GiveawayEntity} from "./giveaway.entity";

@Entity('giveaways_bets')
export class GiveawayBetEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number

    @Column()
    giveaway_id: number

    @Column('boolean', { default: false })
    is_winner: boolean

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: UserEntity

    @ManyToOne(type => GiveawayEntity)
    @JoinColumn({name: 'giveaway_id', referencedColumnName: 'id'})
    giveaway: GiveawayEntity

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date
}