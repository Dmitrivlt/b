import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne, JoinColumn
} from 'typeorm';
import { UserEntity } from "./user.entity";
import { GameEntity } from "./game.entity";
import {ApiProperty} from "@nestjs/swagger";

@Entity('bets')
export class BetEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user_id: number

    @Column()
    game_id: number

    @Column('double', { precision: 255, scale: 2 })
    sum: number

    @Column('json')
    items: string

    @Column()
    items_cnt: number

    @Column()
    from: number

    @Column()
    to: number

    @ApiProperty()
    @Column('boolean', { default: false })
    is_fake: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(type => UserEntity)
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: UserEntity

    @ManyToOne(type => GameEntity)
    @JoinColumn({name: 'game_id', referencedColumnName: 'id'})
    game: UserEntity
}
