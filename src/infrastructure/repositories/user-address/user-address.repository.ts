import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserAddressModel } from '@app/domain/models';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';
import { Transaction } from 'sequelize';

@Injectable()
export class UserAddressRepository {
    constructor(
        @InjectModel(UserAddressModel)
        private readonly userAddressModel: typeof UserAddressModel,
    ) {}

    private pickAllowedFromCreate(dto: CreateUserAddressDto) {
        const {
            title,
            street,
            house,
            apartment,
            city,
            postal_code,
            country,
            is_default,
        } = dto;
        return {
            title,
            street,
            house,
            apartment,
            city,
            postal_code,
            country,
            is_default,
        };
    }

    private pickAllowedFromUpdate(dto: UpdateUserAddressDto) {
        const allowed: Partial<
            ReturnType<UserAddressRepository['pickAllowedFromCreate']>
        > = {};
        if (dto.title !== undefined) allowed.title = dto.title;
        if (dto.street !== undefined) allowed.street = dto.street;
        if (dto.house !== undefined) allowed.house = dto.house;
        if (dto.apartment !== undefined) allowed.apartment = dto.apartment;
        if (dto.city !== undefined) allowed.city = dto.city;
        if (dto.postal_code !== undefined)
            allowed.postal_code = dto.postal_code;
        if (dto.country !== undefined) allowed.country = dto.country;
        if (dto.is_default !== undefined) allowed.is_default = dto.is_default;
        return allowed;
    }

    public async withTransaction<T>(
        fn: (trx: Transaction) => Promise<T>,
    ): Promise<T> {
        const sequelize = this.userAddressModel.sequelize;
        if (!sequelize) {
            return fn(undefined as unknown as Transaction);
        }
        return sequelize.transaction(fn);
    }

    public async create(
        userId: number,
        dto: CreateUserAddressDto,
        trx?: Transaction,
    ): Promise<CreateUserAddressResponse> {
        const allowed = this.pickAllowedFromCreate(dto);
        const address = await this.userAddressModel.create(
            {
                user_id: userId,
                ...allowed,
                // Используем дефолтное значение, если country не передано
                country: allowed.country || 'Россия',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            { transaction: trx },
        );
        return address as CreateUserAddressResponse;
    }

    public async findAll(
        userId: number,
        trx?: Transaction,
    ): Promise<GetUserAddressResponse[]> {
        return this.userAddressModel.findAll({
            attributes: [
                'id',
                'user_id',
                'title',
                'street',
                'house',
                'apartment',
                'city',
                'postal_code',
                'country',
                'is_default',
            ],
            where: { user_id: userId },
            order: [
                ['is_default', 'DESC'],
                ['created_at', 'ASC'],
            ],
            transaction: trx,
        }) as Promise<GetUserAddressResponse[]>;
    }

    public async findOne(
        userId: number,
        id: number,
        trx?: Transaction,
    ): Promise<GetUserAddressResponse | null> {
        return this.userAddressModel.findOne({
            attributes: [
                'id',
                'user_id',
                'title',
                'street',
                'house',
                'apartment',
                'city',
                'postal_code',
                'country',
                'is_default',
            ],
            where: { id, user_id: userId },
            transaction: trx,
        }) as Promise<GetUserAddressResponse | null>;
    }

    public async update(
        userId: number,
        id: number,
        dto: UpdateUserAddressDto,
        trx?: Transaction,
    ): Promise<UpdateUserAddressResponse | null> {
        const allowed = this.pickAllowedFromUpdate(
            dto,
        ) as Partial<UserAddressModel>;
        const [affected] = await this.userAddressModel.update(allowed, {
            where: { id, user_id: userId },
            limit: 1,
            transaction: trx,
        });
        if (!affected) return null;
        return (await this.findOne(
            userId,
            id,
            trx,
        )) as UpdateUserAddressResponse | null;
    }

    public async clearDefault(
        userId: number,
        trx?: Transaction,
    ): Promise<void> {
        await this.userAddressModel.update(
            { is_default: false },
            { where: { user_id: userId }, transaction: trx },
        );
    }

    public async markDefault(
        userId: number,
        id: number,
        trx?: Transaction,
    ): Promise<UpdateUserAddressResponse | null> {
        const [marked] = await this.userAddressModel.update(
            { is_default: true },
            { where: { id, user_id: userId }, limit: 1, transaction: trx },
        );
        if (!marked) return null;
        return (await this.findOne(
            userId,
            id,
            trx,
        )) as UpdateUserAddressResponse | null;
    }

    public async setDefault(
        userId: number,
        id: number,
        trx?: Transaction,
    ): Promise<UpdateUserAddressResponse | null> {
        await this.clearDefault(userId, trx);
        return this.markDefault(userId, id, trx);
    }

    public async remove(
        userId: number,
        id: number,
        trx?: Transaction,
    ): Promise<number> {
        return this.userAddressModel.destroy({
            where: { id, user_id: userId },
            transaction: trx,
        });
    }
}
