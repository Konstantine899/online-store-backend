import { Injectable, NotFoundException } from '@nestjs/common';
import { UserAddressRepository } from '@app/infrastructure/repositories';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    RemoveUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';
import { CreateUserAddressDto, UpdateUserAddressDto } from '@app/infrastructure/dto';

@Injectable()
export class UserAddressService {
    constructor(private readonly userAddressRepository: UserAddressRepository) {}

    public async createAddress(
        userId: number,
        dto: CreateUserAddressDto,
    ): Promise<CreateUserAddressResponse> {
        // Первый адрес или явный основной — снимем флаг с остальных
        if (dto.is_default) {
            await this.userAddressRepository.setDefault(userId, -1); // снимем флаги, id=-1 ничего не включит
        }
        const created = await this.userAddressRepository.create(userId, dto);
        if (dto.is_default === true) {
            const updated = await this.userAddressRepository.setDefault(
                userId,
                created.id,
            );
            return updated as CreateUserAddressResponse;
        }
        return created;
    }

    public async getAddresses(userId: number): Promise<GetUserAddressResponse[]> {
        return this.userAddressRepository.findAll(userId);
    }

    public async getAddress(userId: number, id: number): Promise<GetUserAddressResponse> {
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
        const updated = await this.userAddressRepository.update(userId, id, dto);
        if (!updated) {
            throw new NotFoundException('Адрес не найден');
        }
        if (dto.is_default === true) {
            const refreshed = await this.userAddressRepository.setDefault(
                userId,
                id,
            );
            return refreshed as UpdateUserAddressResponse;
        }
        return updated;
    }

    public async removeAddress(userId: number, id: number): Promise<RemoveUserAddressResponse> {
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
        const updated = await this.userAddressRepository.setDefault(userId, id);
        if (!updated) {
            throw new NotFoundException('Адрес не найден');
        }
        return updated;
    }
}