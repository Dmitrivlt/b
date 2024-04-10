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
import {GameEntity} from "./game.entity";

@Entity('trades')
export class TradeEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: null })
    user_id: number

    @Column({ default: null })
    game_id: number

    @Column({ default: null })
    order_id: string

    @Column('json', { default: null })
    items: string

    @Column({ default: null })
    type: string

    @Column({ default: null })
    status: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: UserEntity

    @ManyToOne(type => GameEntity)
    @JoinColumn({name: 'game_id', referencedColumnName: 'id'})
    game: GameEntity
}