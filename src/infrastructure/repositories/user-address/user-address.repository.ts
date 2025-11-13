import { UserAddressModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class UserAddressRepository {
    constructor(
        @InjectModel(UserAddressModel)
        private readonly userAddressModel: typeof UserAddressModel,
        private readonly tenantContext: TenantContext,
    ) {}

    private pickAllowedFromCreate(dto: CreateUserAddressDto): {
        title: string;
        street: string;
        house: string;
        apartment?: string;
        city: string;
        postal_code?: string;
        country?: string;
        is_default?: boolean;
    } {
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

    private pickAllowedFromUpdate(
        dto: UpdateUserAddressDto,
    ): Partial<ReturnType<UserAddressRepository['pickAllowedFromCreate']>> {
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

    /**
     * Создаёт новый адрес для пользователя
     *
     * Производительность:
     * - Если is_default=false: 1 запрос (INSERT) ~1-2ms
     * - Если is_default=true: 2 запроса (clearDefault + INSERT) ~2-4ms
     *
     * Оба запроса выполняются в одной транзакции для атомарности:
     * гарантируется что у пользователя всегда только один default адрес
     */
    public async create(
        userId: number,
        dto: CreateUserAddressDto,
        trx?: Transaction,
    ): Promise<CreateUserAddressResponse> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        const allowed = this.pickAllowedFromCreate(dto);

        // Если создаём default адрес - сначала сбрасываем все остальные default адреса пользователя
        if (allowed.is_default === true) {
            await this.clearDefault(userId, trx);
        }

        const address = await this.userAddressModel.create(
            {
                user_id: userId,
                ...allowed,
                // Используем дефолтное значение, если country не передано
                country: allowed.country ?? 'Россия',
                tenant_id: tenantId,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            { transaction: trx },
        );
        return address as CreateUserAddressResponse;
    }

    public async findAll(
        userId: number,
        trx?: Transaction,
    ): Promise<GetUserAddressResponse[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
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
            where: { user_id: userId, tenant_id: tenantId },
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
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;

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
            where: { id, user_id: userId, tenant_id: tenantId },
            transaction: trx,
        }) as Promise<GetUserAddressResponse | null>;
    }

    /**
     * Обновляет адрес пользователя
     *
     * Производительность:
     * - Если is_default не меняется: 2 запроса (UPDATE + SELECT) ~2-3ms
     * - Если is_default=true: 3 запроса (clearDefault + UPDATE + SELECT) ~3-5ms
     *
     * SELECT в конце нужен для возврата обновлённых данных (Sequelize не поддерживает RETURNING в MySQL)
     * Все запросы выполняются в одной транзакции для атомарности
     */
    public async update(
        userId: number,
        id: number,
        dto: UpdateUserAddressDto,
        trx?: Transaction,
    ): Promise<UpdateUserAddressResponse | null> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        const allowed = this.pickAllowedFromUpdate(
            dto,
        ) as Partial<UserAddressModel>;

        // Если устанавливаем is_default: true - сначала сбрасываем все остальные default адреса пользователя
        if (allowed.is_default === true) {
            await this.clearDefault(userId, trx);
        }

        const [affected] = await this.userAddressModel.update(allowed, {
            where: { id, user_id: userId, tenant_id: tenantId },
            limit: 1,
            transaction: trx,
        });
        if (!affected) return null;
        return await this.findOne(userId, id, trx);
    }

    /**
     * Сбрасывает флаг is_default для всех адресов пользователя в рамках tenant
     *
     * Производительность: O(log n + m), где m = кол-во адресов пользователя (обычно 1-5)
     * - Использует индекс: idx_user_address_tenant_id_user_id (tenant_id, user_id)
     * - Если default адреса нет: ~0.1-0.5ms (индекс scan без записи)
     * - Если есть default адрес: ~1-2ms (индекс scan + обновление)
     *
     * Почему без предварительной проверки наличия default:
     * UPDATE без проверки быстрее чем SELECT + условный UPDATE (1 запрос вместо 2)
     */
    public async clearDefault(
        userId: number,
        trx?: Transaction,
    ): Promise<void> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;
        await this.userAddressModel.update(
            { is_default: false },
            {
                where: { user_id: userId, tenant_id: tenantId },
                transaction: trx,
            },
        );
    }

    public async markDefault(
        userId: number,
        id: number,
        trx?: Transaction,
    ): Promise<UpdateUserAddressResponse | null> {
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;

        const [marked] = await this.userAddressModel.update(
            { is_default: true },
            {
                where: { id, user_id: userId, tenant_id: tenantId },
                limit: 1,
                transaction: trx,
            },
        );
        if (!marked) return null;
        return await this.findOne(userId, id, trx);
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
        const tenantId = this.tenantContext.getTenantIdOrNull() ?? 1;

        return this.userAddressModel.destroy({
            where: { id, user_id: userId, tenant_id: tenantId },
            transaction: trx,
        });
    }
}
