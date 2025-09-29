import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { UserAddressRepository } from '@app/infrastructure/repositories';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';

describe('UserAddressService', () => {
    let service: UserAddressService;
    let repo: jest.Mocked<UserAddressRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAddressService,
                {
                    provide: UserAddressRepository,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        setDefault: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get(UserAddressService);
        repo = module.get(UserAddressRepository) as jest.Mocked<UserAddressRepository>;
    });

    it('createAddress: creates non-default address', async () => {
        const dto: CreateUserAddressDto = {
            title: 'Дом',
            street: 'ул. Пушкина',
            house: '10',
            city: 'Москва',
        } as CreateUserAddressDto;
        const created: CreateUserAddressResponse = {
            id: 1,
            user_id: 3,
            title: dto.title,
            street: dto.street,
            house: dto.house,
            city: dto.city,
            is_default: false,
        } as unknown as CreateUserAddressResponse;
        repo.create.mockResolvedValue(created);

        const res = await service.createAddress(3, dto);
        expect(repo.create).toHaveBeenCalledWith(3, dto);
        expect(res).toEqual(created);
        expect(repo.setDefault).not.toHaveBeenCalled();
    });

    it('createAddress: creates default address and returns refreshed entity', async () => {
        const dto: CreateUserAddressDto = {
            title: 'Работа',
            street: 'Тверская',
            house: '1',
            city: 'Москва',
            is_default: true,
        } as CreateUserAddressDto;

        const created: CreateUserAddressResponse = {
            id: 2,
            user_id: 3,
            title: dto.title,
            street: dto.street,
            house: dto.house,
            city: dto.city,
            is_default: true,
        } as unknown as CreateUserAddressResponse;
        const refreshed: UpdateUserAddressResponse = {
            id: 2,
            user_id: 3,
            title: dto.title,
            street: dto.street,
            house: dto.house,
            city: dto.city,
            is_default: true,
        } as unknown as UpdateUserAddressResponse;
        repo.create.mockResolvedValue(created);
        repo.setDefault.mockResolvedValue(refreshed);

        const res = await service.createAddress(3, dto);
        expect(repo.setDefault).toHaveBeenCalledWith(3, 2);
        expect(res).toEqual(refreshed);
    });

    it('getAddresses: returns list', async () => {
        repo.findAll.mockResolvedValue([{ id: 1 } as unknown as GetUserAddressResponse]);
        const res = await service.getAddresses(3);
        expect(repo.findAll).toHaveBeenCalledWith(3);
        expect(res).toEqual([{ id: 1 }]);
    });

    it('getAddress: throws NotFound if missing', async () => {
        repo.findOne.mockResolvedValue(null);
        await expect(service.getAddress(3, 10)).rejects.toThrow(NotFoundException);
    });

    it('getAddress: returns entity', async () => {
        const ent = { id: 5 } as unknown as GetUserAddressResponse;
        repo.findOne.mockResolvedValue(ent);
        const res = await service.getAddress(3, 5);
        expect(res).toBe(ent);
    });

    it('updateAddress: updates and returns', async () => {
        const dto: UpdateUserAddressDto = { street: 'Новая' };
        const updated = { id: 7, street: 'Новая' } as unknown as UpdateUserAddressResponse;
        repo.update.mockResolvedValue(updated);
        const res = await service.updateAddress(3, 7, dto);
        expect(repo.update).toHaveBeenCalledWith(3, 7, dto);
        expect(res).toBe(updated);
    });

    it('updateAddress: NotFound', async () => {
        repo.update.mockResolvedValue(null);
        await expect(service.updateAddress(3, 7, {} as UpdateUserAddressDto)).rejects.toThrow(NotFoundException);
    });

    it('updateAddress: when is_default true -> returns refreshed from setDefault', async () => {
        const dto: UpdateUserAddressDto = { is_default: true };
        repo.update.mockResolvedValue({ id: 8, is_default: false } as unknown as UpdateUserAddressResponse);
        repo.setDefault.mockResolvedValue({ id: 8, is_default: true } as unknown as UpdateUserAddressResponse);
        const res = await service.updateAddress(3, 8, dto);
        expect(repo.setDefault).toHaveBeenCalledWith(3, 8);
        expect(res.is_default).toBe(true);
    });

    it('removeAddress: ok', async () => {
        repo.remove.mockResolvedValue(1);
        const res = await service.removeAddress(3, 9);
        expect(repo.remove).toHaveBeenCalledWith(3, 9);
        expect(res.message).toBe('Адрес успешно удалён');
    });

    it('removeAddress: NotFound', async () => {
        repo.remove.mockResolvedValue(0);
        await expect(service.removeAddress(3, 9)).rejects.toThrow(NotFoundException);
    });

    it('setDefaultAddress: ok', async () => {
        const refreshed = { id: 10, is_default: true } as unknown as UpdateUserAddressResponse;
        repo.setDefault.mockResolvedValue(refreshed);
        const res = await service.setDefaultAddress(3, 10);
        expect(repo.setDefault).toHaveBeenCalledWith(3, 10);
        expect(res).toBe(refreshed);
    });

    it('setDefaultAddress: NotFound', async () => {
        repo.setDefault.mockResolvedValue(null);
        await expect(service.setDefaultAddress(3, 10)).rejects.toThrow(NotFoundException);
    });
});