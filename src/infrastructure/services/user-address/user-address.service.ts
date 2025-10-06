import { Injectable, NotFoundException } from '@nestjs/common';
import { UserAddressRepository } from '@app/infrastructure/repositories';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    RemoveUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';

@Injectable()
export class UserAddressService {
    constructor(
        private readonly userAddressRepository: UserAddressRepository,
    ) {}

    public async createAddress(
        userId: number,
        dto: CreateUserAddressDto,
    ): Promise<CreateUserAddressResponse> {
        return this.userAddressRepository.withTransaction(async (trx) => {
            const created = await this.userAddressRepository.create(
                userId,
                dto,
                trx,
            );
            if (dto.is_default === true) {
                await this.userAddressRepository.clearDefault(userId, trx);
                const refreshed = await this.userAddressRepository.markDefault(
                    userId,
                    created.id,
                    trx,
                );
                return refreshed as CreateUserAddressResponse;
            }
            return created;
        });
    }

    public async getAddresses(
        userId: number,
    ): Promise<GetUserAddressResponse[]> {
        return this.userAddressRepository.findAll(userId);
    }

    public async getAddress(
        userId: number,
        id: number,
    ): Promise<GetUserAddressResponse> {
        const found = await this.userAddressRepository.findOne(userId, id);
        if (!found) {
            throw new NotFoundException('Адрес не найден');
        }
        return found;
    }

    public async updateAddress(
        userId: number,
        id: number,
        dto: UpdateUserAddressDto,
    ): Promise<UpdateUserAddressResponse> {
        return this.userAddressRepository.withTransaction(async (trx) => {
            const updated = await this.userAddressRepository.update(
                userId,
                id,
                dto,
                trx,
            );
            if (!updated) {
                throw new NotFoundException('Адрес не найден');
            }
            if (dto.is_default === true) {
                await this.userAddressRepository.clearDefault(userId, trx);
                const refreshed = await this.userAddressRepository.markDefault(
                    userId,
                    id,
                    trx,
                );
                return refreshed as UpdateUserAddressResponse;
            }
            return updated;
        });
    }

    public async removeAddress(
        userId: number,
        id: number,
    ): Promise<RemoveUserAddressResponse> {
        const removed = await this.userAddressRepository.remove(userId, id);
        if (!removed) {
            throw new NotFoundException('Адрес не найден');
        }
        return { message: 'Адрес успешно удалён' };
    }

    public async setDefaultAddress(
        userId: number,
        id: number,
    ): Promise<UpdateUserAddressResponse> {
        return this.userAddressRepository.withTransaction(async (trx) => {
            const updated = await this.userAddressRepository.setDefault(
                userId,
                id,
                trx,
            );
            if (!updated) {
                throw new NotFoundException('Адрес не найден');
            }
            return updated;
        });
    }
}
