import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UserAddressRepository } from './user-address.repository';
import { UserAddressModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';

/**
 * Unit тесты для UserAddressRepository
 * Цель: проверить корректную работу tenant isolation на уровне repository
 * 
 * Ключевые проверки:
 * - create() добавляет tenant_id из TenantContext
 * - findAll(), findOne(), update(), remove() фильтруют по tenant_id
 * - clearDefault(), markDefault(), setDefault() работают tenant-scoped
 * - fallback на tenant_id = 1 когда context возвращает null
 */

describe('UserAddressRepository (Unit)', () => {
    let repository: UserAddressRepository;
    let mockModel: any;
    let mockTenantContext: jest.Mocked<TenantContext>;

    // Константы для тестов
    const TENANT_ID_DEFAULT = 1;
    const TENANT_ID_CUSTOM = 5;
    const USER_ID = 10;
    const ADDRESS_ID = 20;

    // Мок данных для адреса
    const mockAddress = {
        id: ADDRESS_ID,
        user_id: USER_ID,
        title: 'Дом',
        street: 'ул. Тестовая',
        house: '1',
        apartment: '10',
        city: 'Москва',
        postal_code: '101000',
        country: 'Россия',
        is_default: false,
        tenant_id: TENANT_ID_DEFAULT,
    };

    beforeEach(async () => {
        // Мок Sequelize Model
        mockModel = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            sequelize: {
                transaction: jest.fn((callback) => callback({})),
            },
        };

        // Мок TenantContext
        mockTenantContext = {
            getTenantIdOrNull: jest.fn(),
            getTenantIdOrFail: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAddressRepository,
                {
                    provide: getModelToken(UserAddressModel),
                    useValue: mockModel,
                },
                {
                    provide: TenantContext,
                    useValue: mockTenantContext,
                },
            ],
        }).compile();

        repository = module.get<UserAddressRepository>(
            UserAddressRepository,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create()', () => {
        const createDto: CreateUserAddressDto = {
            title: 'Дом',
            street: 'ул. Тестовая',
            house: '1',
            apartment: '10',
            city: 'Москва',
            postal_code: '101000',
            country: 'Россия',
            is_default: false,
        };

        it('должен добавлять tenant_id из TenantContext при создании адреса', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.create.mockResolvedValue(mockAddress);

            // Act
            await repository.create(USER_ID, createDto);

            // Assert
            expect(mockTenantContext.getTenantIdOrNull).toHaveBeenCalled();
            expect(mockModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: USER_ID,
                    tenant_id: TENANT_ID_CUSTOM,
                    title: createDto.title,
                    street: createDto.street,
                    house: createDto.house,
                }),
                { transaction: undefined },
            );
        });

        it('должен использовать fallback tenant_id = 1 когда context возвращает null', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockModel.create.mockResolvedValue(mockAddress);

            // Act
            await repository.create(USER_ID, createDto);

            // Assert
            expect(mockModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenant_id: TENANT_ID_DEFAULT, // fallback
                }),
                { transaction: undefined },
            );
        });

        it('должен использовать дефолтную страну "Россия" если country не передано', async () => {
            // Arrange
            const dtoWithoutCountry = { ...createDto, country: undefined };
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.create.mockResolvedValue(mockAddress);

            // Act
            await repository.create(USER_ID, dtoWithoutCountry);

            // Assert
            expect(mockModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    country: 'Россия',
                }),
                { transaction: undefined },
            );
        });

        it('должен передавать transaction в метод create', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-123' } as any;
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.create.mockResolvedValue(mockAddress);

            // Act
            await repository.create(USER_ID, createDto, mockTransaction);

            // Assert
            expect(mockModel.create).toHaveBeenCalledWith(
                expect.anything(),
                { transaction: mockTransaction },
            );
        });
    });

    describe('findAll()', () => {
        it('должен фильтровать адреса по user_id И tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.findAll.mockResolvedValue([mockAddress]);

            // Act
            await repository.findAll(USER_ID);

            // Assert
            expect(mockTenantContext.getTenantIdOrNull).toHaveBeenCalled();
            expect(mockModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                    order: [
                        ['is_default', 'DESC'],
                        ['created_at', 'ASC'],
                    ],
                }),
            );
        });

        it('должен использовать fallback tenant_id = 1 когда context возвращает null', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockModel.findAll.mockResolvedValue([]);

            // Act
            await repository.findAll(USER_ID);

            // Assert
            expect(mockModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_DEFAULT,
                    },
                }),
            );
        });

        it('должен возвращать адреса отсортированные по is_default DESC, created_at ASC', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.findAll.mockResolvedValue([mockAddress]);

            // Act
            await repository.findAll(USER_ID);

            // Assert
            expect(mockModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [
                        ['is_default', 'DESC'],
                        ['created_at', 'ASC'],
                    ],
                }),
            );
        });

        it('должен передавать transaction в findAll', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-456' } as any;
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.findAll.mockResolvedValue([]);

            // Act
            await repository.findAll(USER_ID, mockTransaction);

            // Assert
            expect(mockModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction: mockTransaction,
                }),
            );
        });
    });

    describe('findOne()', () => {
        it('должен фильтровать по id, user_id И tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.findOne.mockResolvedValue(mockAddress);

            // Act
            await repository.findOne(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockTenantContext.getTenantIdOrNull).toHaveBeenCalled();
            expect(mockModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: ADDRESS_ID,
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                }),
            );
        });

        it('должен использовать fallback tenant_id = 1', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockModel.findOne.mockResolvedValue(null);

            // Act
            await repository.findOne(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenant_id: TENANT_ID_DEFAULT,
                    }),
                }),
            );
        });

        it('должен вернуть null если адрес не найден', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.findOne(USER_ID, ADDRESS_ID);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('update()', () => {
        const updateDto: UpdateUserAddressDto = {
            street: 'ул. Новая',
        };

        it('должен обновлять адрес с проверкой tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.update.mockResolvedValue([1]); // affected rows
            mockModel.findOne.mockResolvedValue({
                ...mockAddress,
                street: 'ул. Новая',
            });

            // Act
            await repository.update(USER_ID, ADDRESS_ID, updateDto);

            // Assert
            expect(mockModel.update).toHaveBeenCalledWith(
                { street: 'ул. Новая' },
                expect.objectContaining({
                    where: {
                        id: ADDRESS_ID,
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                    limit: 1,
                }),
            );
        });

        it('должен вернуть null если адрес не найден (tenant mismatch)', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.update.mockResolvedValue([0]); // no rows affected

            // Act
            const result = await repository.update(
                USER_ID,
                ADDRESS_ID,
                updateDto,
            );

            // Assert
            expect(result).toBeNull();
        });

        it('должен вызвать findOne после успешного update', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.update.mockResolvedValue([1]);
            mockModel.findOne.mockResolvedValue(mockAddress);

            // Act
            await repository.update(USER_ID, ADDRESS_ID, updateDto);

            // Assert
            expect(mockModel.findOne).toHaveBeenCalledTimes(1);
        });
    });

    describe('clearDefault()', () => {
        it('должен очищать default только для user_id + tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.update.mockResolvedValue([2]); // 2 addresses updated

            // Act
            await repository.clearDefault(USER_ID);

            // Assert
            expect(mockModel.update).toHaveBeenCalledWith(
                { is_default: false },
                expect.objectContaining({
                    where: {
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                }),
            );
        });

        it('должен использовать fallback tenant_id = 1', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockModel.update.mockResolvedValue([0]);

            // Act
            await repository.clearDefault(USER_ID);

            // Assert
            expect(mockModel.update).toHaveBeenCalledWith(
                { is_default: false },
                expect.objectContaining({
                    where: {
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_DEFAULT,
                    },
                }),
            );
        });

        it('должен работать с transaction', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-789' } as any;
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.update.mockResolvedValue([1]);

            // Act
            await repository.clearDefault(USER_ID, mockTransaction);

            // Assert
            expect(mockModel.update).toHaveBeenCalledWith(
                { is_default: false },
                expect.objectContaining({
                    transaction: mockTransaction,
                }),
            );
        });
    });

    describe('markDefault()', () => {
        it('должен устанавливать default с проверкой tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.update.mockResolvedValue([1]);
            mockModel.findOne.mockResolvedValue({
                ...mockAddress,
                is_default: true,
            });

            // Act
            await repository.markDefault(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockModel.update).toHaveBeenCalledWith(
                { is_default: true },
                expect.objectContaining({
                    where: {
                        id: ADDRESS_ID,
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                    limit: 1,
                }),
            );
        });

        it('должен вернуть null если адрес не найден (tenant mismatch)', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.update.mockResolvedValue([0]); // no rows marked

            // Act
            const result = await repository.markDefault(USER_ID, ADDRESS_ID);

            // Assert
            expect(result).toBeNull();
        });

        it('должен вызвать findOne после успешного markDefault', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.update.mockResolvedValue([1]);
            mockModel.findOne.mockResolvedValue(mockAddress);

            // Act
            await repository.markDefault(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: ADDRESS_ID,
                        user_id: USER_ID,
                    }),
                }),
            );
        });
    });

    describe('setDefault()', () => {
        it('должен вызывать clearDefault и markDefault в правильном порядке', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.update
                .mockResolvedValueOnce([1]) // clearDefault
                .mockResolvedValueOnce([1]); // markDefault
            mockModel.findOne.mockResolvedValue({
                ...mockAddress,
                is_default: true,
            });

            // Act
            await repository.setDefault(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockModel.update).toHaveBeenCalledTimes(2);
            // Первый вызов - clearDefault
            expect(mockModel.update).toHaveBeenNthCalledWith(
                1,
                { is_default: false },
                expect.anything(),
            );
            // Второй вызов - markDefault
            expect(mockModel.update).toHaveBeenNthCalledWith(
                2,
                { is_default: true },
                expect.anything(),
            );
        });

        it('должен работать с transaction', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-set-default' } as any;
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.update.mockResolvedValue([1]);
            mockModel.findOne.mockResolvedValue(mockAddress);

            // Act
            await repository.setDefault(USER_ID, ADDRESS_ID, mockTransaction);

            // Assert
            // Оба вызова update должны получить transaction
            expect(mockModel.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    transaction: mockTransaction,
                }),
            );
        });
    });

    describe('remove()', () => {
        it('должен удалять адрес с проверкой tenant_id', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.destroy.mockResolvedValue(1); // 1 row deleted

            // Act
            const result = await repository.remove(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockTenantContext.getTenantIdOrNull).toHaveBeenCalled();
            expect(mockModel.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: ADDRESS_ID,
                        user_id: USER_ID,
                        tenant_id: TENANT_ID_CUSTOM,
                    },
                }),
            );
            expect(result).toBe(1);
        });

        it('должен вернуть 0 если адрес не найден (tenant mismatch)', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_CUSTOM,
            );
            mockModel.destroy.mockResolvedValue(0); // no rows deleted

            // Act
            const result = await repository.remove(USER_ID, ADDRESS_ID);

            // Assert
            expect(result).toBe(0);
        });

        it('должен использовать fallback tenant_id = 1', async () => {
            // Arrange
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockModel.destroy.mockResolvedValue(1);

            // Act
            await repository.remove(USER_ID, ADDRESS_ID);

            // Assert
            expect(mockModel.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenant_id: TENANT_ID_DEFAULT,
                    }),
                }),
            );
        });

        it('должен передавать transaction в destroy', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-remove' } as any;
            mockTenantContext.getTenantIdOrNull.mockReturnValue(
                TENANT_ID_DEFAULT,
            );
            mockModel.destroy.mockResolvedValue(1);

            // Act
            await repository.remove(USER_ID, ADDRESS_ID, mockTransaction);

            // Assert
            expect(mockModel.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction: mockTransaction,
                }),
            );
        });
    });

    describe('withTransaction()', () => {
        it('должен вызывать callback с transaction объектом', async () => {
            // Arrange
            const mockTransaction = { id: 'trx-test' };
            const callback = jest.fn().mockResolvedValue('result');
            mockModel.sequelize.transaction.mockImplementation((cb) =>
                cb(mockTransaction),
            );

            // Act
            const result = await repository.withTransaction(callback);

            // Assert
            expect(mockModel.sequelize.transaction).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(mockTransaction);
            expect(result).toBe('result');
        });

        it('должен вернуть результат callback если sequelize отсутствует', async () => {
            // Arrange
            const callback = jest.fn().mockResolvedValue('no-sequelize');
            mockModel.sequelize = null;

            // Act
            const result = await repository.withTransaction(callback);

            // Assert
            expect(callback).toHaveBeenCalledWith(undefined);
            expect(result).toBe('no-sequelize');
        });
    });
});

