import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Transaction } from 'sequelize';

// Внутренние импорты
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

// Типы для тестов
type MockedUserAddressRepository = jest.Mocked<UserAddressRepository>;

// Статические константы для тестовых данных
const TEST_DATA = {
    USER_ID: 3,
    ADDRESS_ID: 1,
    DEFAULT_ADDRESS_ID: 2,
    DTO: {
        NON_DEFAULT: {
            title: 'Дом',
            street: 'ул. Пушкина',
            house: '10',
            city: 'Москва',
        } as CreateUserAddressDto,
        DEFAULT: {
            title: 'Работа',
            street: 'Тверская',
            house: '1',
            city: 'Москва',
            is_default: true,
        } as CreateUserAddressDto,
    },
    RESPONSES: {
        CREATED: {
            id: 1,
            user_id: 3,
            title: 'Дом',
            street: 'ул. Пушкина',
            house: '10',
            city: 'Москва',
            is_default: false,
        } as CreateUserAddressResponse,
    },
} as const;

describe('UserAddressService', () => {
    let service: UserAddressService;
    let repo: MockedUserAddressRepository;
    let cachedModule: TestingModule;

    // Вспомогательные функции для создания тестовых объектов
    const createMockResponse = <T>(overrides: Partial<T> = {}): T =>
        ({
            ...TEST_DATA.RESPONSES.CREATED,
            ...overrides,
        }) as T;

    const createMockDto = (
        overrides: Partial<CreateUserAddressDto> = {},
    ): CreateUserAddressDto => ({
        ...TEST_DATA.DTO.NON_DEFAULT,
        ...overrides,
    });

    beforeEach(async () => {
        // Кэшированный модуль для переиспользования
        if (!cachedModule) {
            cachedModule = await Test.createTestingModule({
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
                            withTransaction: jest.fn(),
                            clearDefault: jest.fn(),
                            markDefault: jest.fn(),
                        },
                    },
                ],
            }).compile();
        }

        service = cachedModule.get(UserAddressService);
        repo = cachedModule.get(
            UserAddressRepository,
        ) as MockedUserAddressRepository;

        // Сброс всех моков
        jest.clearAllMocks();

        // Настройка мока withTransaction для выполнения переданной функции
        repo.withTransaction.mockImplementation(async (fn) => {
            return fn({} as Transaction); // Передаем пустой объект как транзакцию
        });
    });

    it('createAddress: creates non-default address', async () => {
        const dto = createMockDto();
        const created = createMockResponse<CreateUserAddressResponse>();

        repo.create.mockResolvedValue(created);

        const res = await service.createAddress(TEST_DATA.USER_ID, dto);

        expect(repo.create).toHaveBeenCalledWith(TEST_DATA.USER_ID, dto, {});
        expect(res).toEqual(created);
        expect(repo.setDefault).not.toHaveBeenCalled();
    });

    it('createAddress: creates default address and returns refreshed entity', async () => {
        const dto = createMockDto(TEST_DATA.DTO.DEFAULT);
        const created = createMockResponse<CreateUserAddressResponse>({
            id: TEST_DATA.DEFAULT_ADDRESS_ID,
            title: dto.title,
            street: dto.street,
            house: dto.house,
            city: dto.city,
            is_default: true,
        });
        const refreshed = createMockResponse<UpdateUserAddressResponse>({
            id: TEST_DATA.DEFAULT_ADDRESS_ID,
            title: dto.title,
            street: dto.street,
            house: dto.house,
            city: dto.city,
            is_default: true,
        });

        repo.create.mockResolvedValue(created);
        repo.clearDefault.mockResolvedValue(undefined);
        repo.markDefault.mockResolvedValue(refreshed);

        const res = await service.createAddress(TEST_DATA.USER_ID, dto);

        expect(repo.clearDefault).toHaveBeenCalledWith(TEST_DATA.USER_ID, {});
        expect(repo.markDefault).toHaveBeenCalledWith(
            TEST_DATA.USER_ID,
            TEST_DATA.DEFAULT_ADDRESS_ID,
            {},
        );
        expect(res).toEqual(refreshed);
    });

    it('getAddresses: returns list', async () => {
        const addresses = [
            createMockResponse<GetUserAddressResponse>({ id: 1 }),
        ];
        repo.findAll.mockResolvedValue(addresses);

        const res = await service.getAddresses(TEST_DATA.USER_ID);

        expect(repo.findAll).toHaveBeenCalledWith(TEST_DATA.USER_ID);
        expect(res).toEqual(addresses);
    });

    it('getAddress: should return entity when found', async () => {
        const entity = createMockResponse<GetUserAddressResponse>({ id: 5 });
        repo.findOne.mockResolvedValue(entity);

        const res = await service.getAddress(TEST_DATA.USER_ID, 5);

        expect(repo.findOne).toHaveBeenCalledWith(TEST_DATA.USER_ID, 5);
        expect(res).toBe(entity);
    });

    it('getAddress: should throw NotFoundException when not found', async () => {
        repo.findOne.mockResolvedValue(null);

        await expect(service.getAddress(TEST_DATA.USER_ID, 10)).rejects.toThrow(
            NotFoundException,
        );
    });

    it('updateAddress: should update and return entity', async () => {
        const dto: UpdateUserAddressDto = { street: 'Новая' };
        const updated = createMockResponse<UpdateUserAddressResponse>({
            id: 7,
            street: 'Новая',
        });
        repo.update.mockResolvedValue(updated);

        const res = await service.updateAddress(TEST_DATA.USER_ID, 7, dto);

        expect(repo.update).toHaveBeenCalledWith(TEST_DATA.USER_ID, 7, dto, {});
        expect(res).toBe(updated);
    });

    it('updateAddress: should throw NotFoundException when not found', async () => {
        repo.update.mockResolvedValue(null);

        await expect(
            service.updateAddress(
                TEST_DATA.USER_ID,
                7,
                {} as UpdateUserAddressDto,
            ),
        ).rejects.toThrow(NotFoundException);
    });

    it('updateAddress: should return refreshed entity when is_default true', async () => {
        const dto: UpdateUserAddressDto = { is_default: true };
        const updated = createMockResponse<UpdateUserAddressResponse>({
            id: 8,
            is_default: false,
        });
        const refreshed = createMockResponse<UpdateUserAddressResponse>({
            id: 8,
            is_default: true,
        });

        repo.update.mockResolvedValue(updated);
        repo.clearDefault.mockResolvedValue(undefined);
        repo.markDefault.mockResolvedValue(refreshed);

        const res = await service.updateAddress(TEST_DATA.USER_ID, 8, dto);

        expect(repo.clearDefault).toHaveBeenCalledWith(TEST_DATA.USER_ID, {});
        expect(repo.markDefault).toHaveBeenCalledWith(TEST_DATA.USER_ID, 8, {});
        expect(res.is_default).toBe(true);
    });

    it('removeAddress: should remove address successfully', async () => {
        repo.remove.mockResolvedValue(1);

        const res = await service.removeAddress(TEST_DATA.USER_ID, 9);

        expect(repo.remove).toHaveBeenCalledWith(TEST_DATA.USER_ID, 9);
        expect(res.message).toBe('Адрес успешно удалён');
    });

    it('removeAddress: should throw NotFoundException when not found', async () => {
        repo.remove.mockResolvedValue(0);

        await expect(
            service.removeAddress(TEST_DATA.USER_ID, 9),
        ).rejects.toThrow(NotFoundException);
    });

    it('setDefaultAddress: should set default address successfully', async () => {
        const refreshed = createMockResponse<UpdateUserAddressResponse>({
            id: 10,
            is_default: true,
        });
        repo.setDefault.mockResolvedValue(refreshed);

        const res = await service.setDefaultAddress(TEST_DATA.USER_ID, 10);

        expect(repo.setDefault).toHaveBeenCalledWith(TEST_DATA.USER_ID, 10, {});
        expect(res).toBe(refreshed);
    });

    it('setDefaultAddress: should throw NotFoundException when not found', async () => {
        repo.setDefault.mockResolvedValue(null);

        await expect(
            service.setDefaultAddress(TEST_DATA.USER_ID, 10),
        ).rejects.toThrow(NotFoundException);
    });
});
