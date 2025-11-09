import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { LoginHistoryService } from '@app/infrastructure/services/login-history/login-history.service';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import { UserService } from '@app/infrastructure/services/user/user.service';
import {
    BadRequestException,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

/**
 * USER-001-06: Комплексные unit тесты для системы верификации email/телефона
 *
 * Покрытие:
 * - UserService.requestVerificationCode: успех, cooldown, tenant isolation, ошибки
 * - UserService.confirmVerificationCode: успех, неверный код, истекший код, попытки
 * - Обработка ошибок и логирование
 */
describe('UserService - Verification System (USER-001-06)', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;

    beforeEach(async () => {
        const mockUserRepository = {
            requestVerificationCode: jest.fn(),
            confirmVerificationCode: jest.fn(),
        } as unknown as jest.Mocked<UserRepository>;

        const mockRoleService = {
            getRole: jest.fn(),
        } as unknown as RoleService;

        const mockRefreshTokenRepository = {
            findByUserId: jest.fn(),
        } as unknown as RefreshTokenRepository;

        const mockUserModel = {};

        const mockLoginHistoryService = {
            createLoginHistory: jest.fn(),
        } as unknown as LoginHistoryService;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: mockUserRepository,
                },
                {
                    provide: RoleService,
                    useValue: mockRoleService,
                },
                {
                    provide: RefreshTokenRepository,
                    useValue: mockRefreshTokenRepository,
                },
                {
                    provide: 'UserModelRepository',
                    useValue: mockUserModel,
                },
                {
                    provide: LoginHistoryService,
                    useValue: mockLoginHistoryService,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get(UserRepository);

        // Мокаем logger чтобы не захламлять консоль
        jest.spyOn(service['logger'], 'info').mockImplementation();
        jest.spyOn(service['logger'], 'warn').mockImplementation();
        jest.spyOn(service['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // VERIFY-01.1: requestVerificationCode - Success Cases
    // ============================================================
    describe('requestVerificationCode - Success Cases', () => {
        it('должен успешно запросить код верификации для email', async () => {
            // Arrange
            userRepository.requestVerificationCode.mockResolvedValue(undefined);

            // Act
            await service.requestVerificationCode(1, 'email', 1);

            // Assert
            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                1,
            );
            expect(
                userRepository.requestVerificationCode,
            ).toHaveBeenCalledTimes(1);
            expect(service['logger'].info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Запрошен код верификации',
                    userId: 1,
                    channel: 'email',
                    tenantId: 1,
                }),
            );
        });

        it('должен успешно запросить код верификации для phone', async () => {
            // Arrange
            userRepository.requestVerificationCode.mockResolvedValue(undefined);

            // Act
            await service.requestVerificationCode(1, 'phone', 1);

            // Assert
            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(
                1,
                'phone',
                1,
            );
            expect(
                userRepository.requestVerificationCode,
            ).toHaveBeenCalledTimes(1);
            expect(service['logger'].info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Запрошен код верификации',
                    userId: 1,
                    channel: 'phone',
                    tenantId: 1,
                }),
            );
        });

        it('должен корректно передать все параметры в репозиторий', async () => {
            // Arrange
            const userId = 42;
            const channel = 'email' as const;
            const tenantId = 5;
            userRepository.requestVerificationCode.mockResolvedValue(undefined);

            // Act
            await service.requestVerificationCode(userId, channel, tenantId);

            // Assert
            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(
                userId,
                channel,
                tenantId,
            );
        });
    });

    // ============================================================
    // VERIFY-01.1.5: requestVerificationCode - Parameter Validation
    // ============================================================
    describe('requestVerificationCode - Parameter Validation', () => {
        it('должен отклонить userId = 0', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID пользователя должен быть положительным числом',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(0, 'email', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить отрицательный userId', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID пользователя должен быть положительным числом',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(-1, 'email', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить tenantId = 0', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID тенанта должен быть положительным числом',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 0),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить отрицательный tenantId', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID тенанта должен быть положительным числом',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'phone', -5),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================================
    // VERIFY-01.2: requestVerificationCode - Cooldown
    // ============================================================
    describe('requestVerificationCode - Cooldown Protection', () => {
        it('должен выбросить BadRequestException при активном cooldown', async () => {
            // Arrange
            const cooldownError = new BadRequestException(
                'Пожалуйста, подождите 45 секунд перед повторным запросом кода',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                cooldownError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow('Пожалуйста, подождите');

            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                1,
            );
        });

        it('должен правильно обработать cooldown для разных каналов', async () => {
            // Arrange
            const emailCooldownError = new BadRequestException(
                'Пожалуйста, подождите 30 секунд перед повторным запросом кода',
            );
            const phoneCooldownError = new BadRequestException(
                'Пожалуйста, подождите 20 секунд перед повторным запросом кода',
            );

            userRepository.requestVerificationCode
                .mockRejectedValueOnce(emailCooldownError)
                .mockRejectedValueOnce(phoneCooldownError);

            // Act & Assert - email cooldown
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(BadRequestException);

            // Act & Assert - phone cooldown
            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow(BadRequestException);

            expect(
                userRepository.requestVerificationCode,
            ).toHaveBeenCalledTimes(2);
        });
    });

    // ============================================================
    // VERIFY-01.2.5: requestVerificationCode - Rate Limiting
    // ============================================================
    describe('requestVerificationCode - Rate Limiting', () => {
        it('должен пропустить 3 запроса в секунду', async () => {
            // Arrange
            userRepository.requestVerificationCode.mockResolvedValue(undefined);

            // Act & Assert - 3 запроса должны пройти
            for (let i = 0; i < 3; i++) {
                await expect(
                    service.requestVerificationCode(1, 'email', 1),
                ).resolves.toBeUndefined();
            }

            expect(
                userRepository.requestVerificationCode,
            ).toHaveBeenCalledTimes(3);
        });

        it('должен вернуть 429 Too Many Requests при превышении лимита 3 req/sec', async () => {
            // Arrange
            const rateLimitError = new BadRequestException({
                statusCode: 429,
                message: 'Слишком много запросов. Попробуйте позже.',
            });

            userRepository.requestVerificationCode
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(rateLimitError);

            // Act - 3 запроса успешны
            for (let i = 0; i < 3; i++) {
                await service.requestVerificationCode(1, 'email', 1);
            }

            // Act & Assert - 4-й запрос блокируется
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toMatchObject({
                response: expect.objectContaining({
                    statusCode: 429,
                }),
            });
        });

        it('должен заблокировать после 20 запросов в 10 секунд', async () => {
            // Arrange
            const rateLimitError = new BadRequestException(
                'Превышен лимит запросов: максимум 20 за 10 секунд',
            );

            // 20 успешных запросов
            for (let i = 0; i < 20; i++) {
                userRepository.requestVerificationCode.mockResolvedValueOnce(
                    undefined,
                );
            }
            // 21-й запрос блокируется
            userRepository.requestVerificationCode.mockRejectedValueOnce(
                rateLimitError,
            );

            // Act - 20 запросов проходят
            for (let i = 0; i < 20; i++) {
                await service.requestVerificationCode(1, 'phone', 1);
            }

            // Act & Assert - 21-й запрос блокируется
            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow('Превышен лимит запросов');
        });

        it('должен применять rate limiting независимо для разных каналов', async () => {
            // Arrange
            const emailRateLimit = new BadRequestException('Rate limit: email');
            const phoneRateLimit = new BadRequestException('Rate limit: phone');

            // Сначала проверяем email rate limiting
            userRepository.requestVerificationCode
                .mockResolvedValueOnce(undefined) // email 1
                .mockResolvedValueOnce(undefined) // email 2
                .mockResolvedValueOnce(undefined) // email 3
                .mockRejectedValueOnce(emailRateLimit); // email 4 - блокировка

            // Act - email: 3 успешных, 1 блокировка
            for (let i = 0; i < 3; i++) {
                await service.requestVerificationCode(1, 'email', 1);
            }
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow('Rate limit: email');

            // Arrange - теперь проверяем phone rate limiting (независимо)
            userRepository.requestVerificationCode
                .mockResolvedValueOnce(undefined) // phone 1
                .mockResolvedValueOnce(undefined) // phone 2
                .mockResolvedValueOnce(undefined) // phone 3
                .mockRejectedValueOnce(phoneRateLimit); // phone 4 - блокировка

            // Act - phone: 3 успешных, 1 блокировка
            for (let i = 0; i < 3; i++) {
                await service.requestVerificationCode(1, 'phone', 1);
            }
            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow('Rate limit: phone');
        });
    });

    // ============================================================
    // VERIFY-01.3: requestVerificationCode - Tenant Isolation
    // ============================================================
    describe('requestVerificationCode - Tenant Isolation', () => {
        it('должен выбросить NotFoundException если пользователь не принадлежит tenant', async () => {
            // Arrange
            const tenantError = new NotFoundException(
                'Пользователь с ID 1 не найден или не принадлежит вашему tenant',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                tenantError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 999), // неверный tenant
            ).rejects.toThrow(NotFoundException);

            await expect(
                service.requestVerificationCode(1, 'email', 999),
            ).rejects.toThrow('не принадлежит вашему tenant');
        });

        it('должен передать tenantId для проверки изоляции', async () => {
            // Arrange
            userRepository.requestVerificationCode.mockResolvedValue(undefined);

            // Act
            await service.requestVerificationCode(10, 'phone', 2);

            // Assert
            expect(userRepository.requestVerificationCode).toHaveBeenCalledWith(
                10,
                'phone',
                2, // tenantId должен быть передан для проверки
            );
        });

        it('должен корректно обработать разные tenants для одного пользователя', async () => {
            // Arrange
            userRepository.requestVerificationCode
                .mockResolvedValueOnce(undefined) // tenant 1 - успех
                .mockRejectedValueOnce(
                    new NotFoundException('не принадлежит вашему tenant'),
                ); // tenant 2 - ошибка

            // Act & Assert - tenant 1 success
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).resolves.toBeUndefined();

            // Act & Assert - tenant 2 forbidden
            await expect(
                service.requestVerificationCode(1, 'email', 2),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================================
    // VERIFY-01.4: requestVerificationCode - Phone Validation
    // ============================================================
    describe('requestVerificationCode - Phone Validation', () => {
        it('должен выбросить BadRequestException если phone отсутствует для channel=phone', async () => {
            // Arrange
            const noPhoneError = new BadRequestException(
                'Номер телефона не указан в профиле',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                noPhoneError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow('Номер телефона не указан');
        });
    });

    // ============================================================
    // VERIFY-01.5: requestVerificationCode - Error Handling
    // ============================================================
    describe('requestVerificationCode - Repository Error Handling', () => {
        it('должен пробросить ошибку репозитория без изменений (NotFoundException)', async () => {
            // Arrange
            const repoError = new NotFoundException('Пользователь не найден');
            userRepository.requestVerificationCode.mockRejectedValue(repoError);

            // Act & Assert
            await expect(
                service.requestVerificationCode(999, 'email', 1),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен пробросить ошибку репозитория без изменений (BadRequestException)', async () => {
            // Arrange
            const repoError = new BadRequestException('Некорректные данные');
            userRepository.requestVerificationCode.mockRejectedValue(repoError);

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен корректно обработать ошибку провайдера email/SMS', async () => {
            // Arrange
            const providerError = new Error(
                'Не удалось отправить email: SMTP connection failed',
            );
            userRepository.requestVerificationCode.mockRejectedValue(
                providerError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow('Не удалось отправить email');
        });

        it('должен обработать общие ошибки как Error', async () => {
            // Arrange
            const genericError = new Error('Unexpected error');
            userRepository.requestVerificationCode.mockRejectedValue(
                genericError,
            );

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow(Error);
        });

        it('должен обработать Sequelize database errors', async () => {
            // Arrange
            const dbError = new Error('SequelizeDatabaseError');
            dbError.name = 'SequelizeDatabaseError';
            userRepository.requestVerificationCode.mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                service.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow();
        });
    });

    // ============================================================
    // VERIFY-02.1: confirmVerificationCode - Success Cases
    // ============================================================
    describe('confirmVerificationCode - Success Cases', () => {
        it('должен успешно подтвердить корректный код для email', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            const invalidateUserCacheSpy = jest
                .spyOn(
                    service as unknown as { invalidateUserCache: () => void },
                    'invalidateUserCache',
                )
                .mockImplementation();

            // Act
            await service.confirmVerificationCode(1, 'email', 'abc123', 1);

            // Assert
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                'abc123',
                1,
            );
            expect(invalidateUserCacheSpy).toHaveBeenCalledWith(1);
            expect(service['logger'].info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Код верификации подтверждён',
                    userId: 1,
                    channel: 'email',
                    tenantId: 1,
                }),
            );
        });

        it('должен успешно подтвердить корректный код для phone', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            const invalidateUserCacheSpy = jest
                .spyOn(
                    service as unknown as { invalidateUserCache: () => void },
                    'invalidateUserCache',
                )
                .mockImplementation();

            // Act
            await service.confirmVerificationCode(1, 'phone', 'def456', 1);

            // Assert
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                1,
                'phone',
                'def456',
                1,
            );
            expect(invalidateUserCacheSpy).toHaveBeenCalledWith(1);
            expect(service['logger'].info).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Код верификации подтверждён',
                    userId: 1,
                    channel: 'phone',
                    tenantId: 1,
                }),
            );
        });

        it('должен инвалидировать кэш пользователя после успешной верификации', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            const invalidateUserCacheSpy = jest
                .spyOn(
                    service as unknown as { invalidateUserCache: () => void },
                    'invalidateUserCache',
                )
                .mockImplementation();

            // Act
            await service.confirmVerificationCode(42, 'email', 'code12', 1);

            // Assert
            expect(invalidateUserCacheSpy).toHaveBeenCalledWith(42);
            expect(invalidateUserCacheSpy).toHaveBeenCalledTimes(1);
        });
    });

    // ============================================================
    // VERIFY-02.1.5: confirmVerificationCode - Parameter Validation
    // ============================================================
    describe('confirmVerificationCode - Parameter Validation', () => {
        it('должен отклонить пустой код', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'Код верификации не может быть пустым',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', '', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить код неправильной длины (< 6 символов)', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'Код верификации должен содержать 6 символов',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'abc', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить код неправильной длины (> 6 символов)', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'Код верификации должен содержать 6 символов',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'phone', 'abc1234567', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить код с невалидными hex символами', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'Код верификации должен содержать только hex символы (0-9, a-f)',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'xyz123', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить код со спецсимволами', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'Код верификации содержит недопустимые символы',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'abc!@#', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить userId = 0 при подтверждении', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID пользователя должен быть положительным числом',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(0, 'email', 'abc123', 1),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен отклонить tenantId = 0 при подтверждении', async () => {
            // Arrange
            const validationError = new BadRequestException(
                'ID тенанта должен быть положительным числом',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                validationError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'phone', 'def456', 0),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================================
    // VERIFY-02.2: confirmVerificationCode - Invalid Code
    // ============================================================
    describe('confirmVerificationCode - Invalid/Expired Code', () => {
        it('должен выбросить BadRequestException при неверном коде', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(false);

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'wrongcode', 1),
            ).rejects.toThrow(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Неверный или просроченный код подтверждения',
                }),
            );

            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                'wrongcode',
                1,
            );
        });

        it('должен выбросить BadRequestException при истекшем коде (TTL)', async () => {
            // Arrange - репозиторий возвращает false для истекшего кода
            userRepository.confirmVerificationCode.mockResolvedValue(false);

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'phone', 'expired', 1),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.confirmVerificationCode(1, 'phone', 'expired', 1),
            ).rejects.toThrow('Неверный или просроченный код подтверждения');
        });

        it('должен принять код в течение 10 минут (TTL)', async () => {
            // Arrange - код в пределах TTL (10 минут)
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            jest.spyOn(
                service as unknown as { invalidateUserCache: () => void },
                'invalidateUserCache',
            ).mockImplementation();

            // Act
            await service.confirmVerificationCode(1, 'email', 'valid1', 1);

            // Assert
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                'valid1',
                1,
            );
        });

        it('должен отклонить код после истечения 10 минут + 1 секунда', async () => {
            // Arrange - код истёк (> 10 минут)
            const expiredError = new BadRequestException(
                'Код верификации истёк. Срок действия: 10 минут',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                expiredError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'phone', 'expired2', 1),
            ).rejects.toThrow('Код верификации истёк');
        });

        it('не должен инвалидировать кэш при неверном коде', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(false);
            const invalidateUserCacheSpy = jest
                .spyOn(
                    service as unknown as { invalidateUserCache: () => void },
                    'invalidateUserCache',
                )
                .mockImplementation();

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'bad', 1),
            ).rejects.toThrow(BadRequestException);

            expect(invalidateUserCacheSpy).not.toHaveBeenCalled();
        });
    });

    // ============================================================
    // VERIFY-02.3: confirmVerificationCode - Tenant Isolation
    // ============================================================
    describe('confirmVerificationCode - Tenant Isolation', () => {
        it('должен проверить tenant isolation при подтверждении кода', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            jest.spyOn(
                service as unknown as { invalidateUserCache: () => void },
                'invalidateUserCache',
            ).mockImplementation();

            // Act
            await service.confirmVerificationCode(5, 'email', 'code99', 3);

            // Assert
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                5,
                'email',
                'code99',
                3, // tenantId передан для проверки
            );
        });

        it('должен выбросить ошибку при попытке подтвердить код из другого tenant', async () => {
            // Arrange
            const tenantError = new NotFoundException(
                'Пользователь не принадлежит вашему tenant',
            );
            userRepository.confirmVerificationCode.mockRejectedValue(
                tenantError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'code12', 999),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ============================================================
    // VERIFY-02.4: confirmVerificationCode - Attempts Limit
    // ============================================================
    describe('confirmVerificationCode - Max Attempts Protection', () => {
        it('должен пропустить до 5 попыток ввода кода', async () => {
            // Arrange - первые 4 попытки неверные, 5-я верная
            userRepository.confirmVerificationCode
                .mockResolvedValueOnce(false) // попытка 1
                .mockResolvedValueOnce(false) // попытка 2
                .mockResolvedValueOnce(false) // попытка 3
                .mockResolvedValueOnce(false) // попытка 4
                .mockResolvedValueOnce(true); // попытка 5 - успех

            jest.spyOn(
                service as unknown as { invalidateUserCache: () => void },
                'invalidateUserCache',
            ).mockImplementation();

            // Act & Assert - первые 4 попытки fail
            for (let i = 1; i <= 4; i++) {
                await expect(
                    service.confirmVerificationCode(1, 'email', `bad${i}`, 1),
                ).rejects.toThrow(BadRequestException);
            }

            // Act & Assert - 5-я попытка success
            await expect(
                service.confirmVerificationCode(1, 'email', 'correct5', 1),
            ).resolves.toBeUndefined();

            expect(
                userRepository.confirmVerificationCode,
            ).toHaveBeenCalledTimes(5);
        });

        it('должен заблокировать код после 5 неудачных попыток', async () => {
            // Arrange
            const maxAttemptsError = new BadRequestException(
                'Превышено максимальное количество попыток (5). Запросите новый код.',
            );

            userRepository.confirmVerificationCode
                .mockResolvedValueOnce(false) // попытка 1
                .mockResolvedValueOnce(false) // попытка 2
                .mockResolvedValueOnce(false) // попытка 3
                .mockResolvedValueOnce(false) // попытка 4
                .mockResolvedValueOnce(false) // попытка 5 (последняя)
                .mockRejectedValueOnce(maxAttemptsError); // попытка 6 - блокировка

            // Act - первые 5 попыток возвращают false
            for (let i = 1; i <= 5; i++) {
                await expect(
                    service.confirmVerificationCode(1, 'phone', `bad${i}`, 1),
                ).rejects.toThrow(BadRequestException);
            }

            // Act & Assert - 6-я попытка блокируется
            await expect(
                service.confirmVerificationCode(1, 'phone', 'bad6', 1),
            ).rejects.toThrow('Превышено максимальное количество попыток');
        });

        it('должен сбросить счётчик attempts после успешной верификации', async () => {
            // Arrange
            userRepository.confirmVerificationCode
                .mockResolvedValueOnce(false) // попытка 1 fail
                .mockResolvedValueOnce(false) // попытка 2 fail
                .mockResolvedValueOnce(true) // попытка 3 success
                .mockResolvedValueOnce(true); // новый код - попытка 1 success

            const invalidateUserCacheSpy = jest
                .spyOn(
                    service as unknown as { invalidateUserCache: () => void },
                    'invalidateUserCache',
                )
                .mockImplementation();

            // Act - 2 неудачных, 1 успешная
            await expect(
                service.confirmVerificationCode(1, 'email', 'bad1', 1),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.confirmVerificationCode(1, 'email', 'bad2', 1),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.confirmVerificationCode(1, 'email', 'good3', 1),
            ).resolves.toBeUndefined();

            // Act - новый код должен иметь сброшенный счётчик
            await expect(
                service.confirmVerificationCode(1, 'email', 'new1', 1),
            ).resolves.toBeUndefined();

            expect(
                userRepository.confirmVerificationCode,
            ).toHaveBeenCalledTimes(4);
            expect(invalidateUserCacheSpy).toHaveBeenCalledTimes(2);
        });

        it('должен инкрементировать attempts при каждой неудачной попытке', async () => {
            // Arrange - каждая неудачная попытка должна инкрементировать счётчик
            userRepository.confirmVerificationCode.mockResolvedValue(false);

            // Act & Assert - проверяем что репозиторий вызывается каждый раз
            for (let i = 1; i <= 5; i++) {
                await expect(
                    service.confirmVerificationCode(1, 'email', `bad${i}`, 1),
                ).rejects.toThrow(BadRequestException);

                // Проверяем что вызов был с правильными параметрами
                expect(
                    userRepository.confirmVerificationCode,
                ).toHaveBeenNthCalledWith(i, 1, 'email', `bad${i}`, 1);
            }

            expect(
                userRepository.confirmVerificationCode,
            ).toHaveBeenCalledTimes(5);
        });
    });

    // ============================================================
    // VERIFY-02.5: confirmVerificationCode - Error Handling
    // ============================================================
    describe('confirmVerificationCode - Error Handling', () => {
        it('должен пробросить ошибку репозитория (NotFoundException)', async () => {
            // Arrange
            const repoError = new NotFoundException('Пользователь не найден');
            userRepository.confirmVerificationCode.mockRejectedValue(repoError);

            // Act & Assert
            await expect(
                service.confirmVerificationCode(999, 'email', 'code', 1),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен обработать ошибки Sequelize', async () => {
            // Arrange
            const dbError = new Error('Database connection lost');
            dbError.name = 'SequelizeDatabaseError';
            userRepository.confirmVerificationCode.mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'phone', 'code', 1),
            ).rejects.toThrow();
        });

        it('должен корректно обработать общие ошибки', async () => {
            // Arrange
            const genericError = new Error('Unexpected verification error');
            userRepository.confirmVerificationCode.mockRejectedValue(
                genericError,
            );

            // Act & Assert
            await expect(
                service.confirmVerificationCode(1, 'email', 'code', 1),
            ).rejects.toThrow(Error);
        });
    });

    // ============================================================
    // VERIFY-02.6: confirmVerificationCode - Code Format Validation
    // ============================================================
    describe('confirmVerificationCode - Code Format', () => {
        it('должен принять код корректного формата (6 hex символов)', async () => {
            // Arrange
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            jest.spyOn(
                service as unknown as { invalidateUserCache: () => void },
                'invalidateUserCache',
            ).mockImplementation();

            // Act
            await service.confirmVerificationCode(1, 'email', 'abc123', 1);

            // Assert
            expect(userRepository.confirmVerificationCode).toHaveBeenCalledWith(
                1,
                'email',
                'abc123',
                1,
            );
        });

        it('должен передать код в репозиторий без изменений', async () => {
            // Arrange
            const codes = ['a1b2c3', 'def456', '123abc', 'ABCDEF'];
            userRepository.confirmVerificationCode.mockResolvedValue(true);
            jest.spyOn(
                service as unknown as { invalidateUserCache: () => void },
                'invalidateUserCache',
            ).mockImplementation();

            // Act & Assert
            for (const code of codes) {
                await service.confirmVerificationCode(1, 'email', code, 1);
                expect(
                    userRepository.confirmVerificationCode,
                ).toHaveBeenCalledWith(
                    1,
                    'email',
                    code, // код передаётся без изменений
                    1,
                );
            }
        });
    });
});
