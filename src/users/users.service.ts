import {Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Repository, UpdateResult} from 'typeorm';
import { UserEntity } from "../entites/user.entity";
import {adjectives, colors, uniqueNamesGenerator} from "unique-names-generator";
import randomInt from "random-int";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {

    }

    async onApplicationBootstrap() {
        const cntFakeUsers = await this.userRepository.count({
            where: {
                is_fake: true
            }
        })

        if (cntFakeUsers > 0) {
            await this.updateAvatars();
        }

        if (cntFakeUsers === 0) {
            await this.createFakeUsers();
        }
    }

    async findOrCreate(profile: any): Promise<UserEntity> {
        let user = await this.findBySteamId(profile.steamid);

        if (!user) {
            user = await this.create({
                username: profile.personaname,
                steamId: profile.steamid,
                avatar: profile.avatarfull
            });
        } else {
            user.username = profile.personaname;
            user.steamId = profile.steamid;
            user.avatar = profile.avatarfull;
        }

        return await this.update(user);
    }

    async findBySteamId(steamId: string): Promise<UserEntity> {
        return await this.userRepository.findOne({
            steamId
        })
    }

    async findById(id: any): Promise<UserEntity> {
        return await this.userRepository.findOne({
            id
        })
    }

    async update(user: UserEntity): Promise<UserEntity> {
        return await this.userRepository.save(user);
    }

    async updateById(userId: number, data: any): Promise<UpdateResult> {
        return await this.userRepository.update(userId, data);
    }

    async create(user: any): Promise<any> {
        return await this.userRepository.save(
            this.userRepository.create(user)
        );
    }

    async getTop(): Promise<UserEntity[]> {
        return await this.userRepository.find({
            select: ["id", "username", "avatar", "total_played", "total_win", "total_wins", "steamId"],
            order: {
                total_win: 'DESC'
            },
            take: 10
        })
    }

    async getLastUsers(limit = 20): Promise<UserEntity[]> {
        return await this.userRepository.find({
            where: {
                is_fake: false
            },
            order: {
                'created_at': 'DESC'
            },
            take: limit
        })
    }

    async getRandomBots(limit: number): Promise<UserEntity[]> {
        return await this.userRepository.createQueryBuilder()
            .where('is_fake = 1')
            .orderBy('RAND()')
            .limit(limit)
            .getMany()
    }

    async getUsers(data): Promise<UserEntity[]> {
        const queryBuilder = this.userRepository.createQueryBuilder()
        queryBuilder.orderBy(`${data.columnName}`, data.columnSortOrder.toUpperCase())
        queryBuilder.where(
            `username LIKE '%${data.searchValue}%' OR steamId LIKE '%${data.searchValue}%'`
        )
        queryBuilder.limit(data.length)
        queryBuilder.offset(data.row)

        return queryBuilder.getMany()
    }

    async getCountAllUsers() {
        const sum = await this.userRepository.createQueryBuilder()
            .select('COUNT(id)', 'cnt')
            .getRawOne()

        return sum.cnt === null ? 0 : sum.cnt
    }

    async updateByRandomData(userId: number, data: any): Promise<UpdateResult> {
        return await this.userRepository.update(userId, data)
    }

    async createFakeUsers() {
        for (let i = 0; i < 100; i++) {
            const username = uniqueNamesGenerator(
                {
                    dictionaries: [adjectives, colors],
                    separator: ' '
                })

            const steamId = randomInt(1, 9999999999999)

            const avatar = `https://i.pravatar.cc/150?u=${steamId}`

            await this.create({
                username: username,
                steamId,
                avatar: avatar,
                is_fake: true
            })
        }
    }

    async updateAvatars() {
        const users = await this.userRepository.find({
            where: {
                is_fake: true
            }
        })

        for (const user of users) {
            user.avatar = `https://i.pravatar.cc/150?u=${user.steamId}`;
            await this.userRepository.save(user);
        }
    }

    async updateLvl(user) {
        if (user.exp >= 100) {
            user.lvl += 1
            user.exp = 0

            await this.userRepository.save(user)
        }
    }

    async getAllUsers(username = '', page: number, limit: number): Promise<any> {
        const queryBuilder = this.userRepository.createQueryBuilder()
        queryBuilder.where(
            `username LIKE '%${username}%' OR steamId LIKE '%${username}%'`
        )
        queryBuilder.limit(limit)
        queryBuilder.offset(page)

        return queryBuilder.getMany()
    }
}
