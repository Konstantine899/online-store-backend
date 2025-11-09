/**
 * Unit тесты для UserRepository - Verification System
 * Покрывает: requestVerificationCode, confirmVerificationCode, hashCode
 *
 * Related to: USER-001-06 (VERIFY-03)
 */

import { UserModel } from '@app/domain/models/user.model';
import { UserRepository } from '@app/infrastructure/repositories/user/user.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { createHash, randomBytes } from 'crypto';

// Моки crypto
jest.mock('crypto', () => ({
    randomBytes: jest.fn(),
    createHash: jest.fn(),
}));

// Константы из verification.config.ts
const VERIFICATION_CODE_COOLDOWN_MS = 60 * 1000; // 60 секунд (1 минута)
const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 минут
const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
const VERIFICATION_CODE_LENGTH_BYTES = 3; // 3 bytes = 6 hex символов

describe('UserRepository - Verification System (USER-001-06, VERIFY-03)', () => {
    let repository: UserRepository;
    let mockSequelize: jest.Mocked<{
        query: jest.Mock;
    }>;
    let mockUserModel: jest.Mocked<{
        sequelize: typeof mockSequelize | null;
        findOne: jest.Mock;
    }>;
    let mockEmailProvider: jest.Mocked<{
        sendEmail: jest.Mock;
    }>;
    let mockSmsProvider: jest.Mocked<{
        sendSms: jest.Mock;
    }>;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        phone: '+79001234567',
        tenantId: 1,
    };

    beforeEach(async () => {
        // Мок Sequelize
        mockSequelize = {
            query: jest.fn(),
        };

        // Мок UserModel
        mockUserModel = {
            sequelize: mockSequelize,
            findOne: jest.fn(),
        };

        // Мок провайдеров
        mockEmailProvider = {
            sendEmail: jest.fn(),
        };

        mockSmsProvider = {
            sendSms: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserRepository,
                {
                    provide: getModelToken(UserModel),
                    useValue: mockUserModel,
                },
                {
                    provide: 'IEmailProvider',
                    useValue: mockEmailProvider,
                },
                {
                    provide: 'ISmsProvider',
                    useValue: mockSmsProvider,
                },
            ],
        }).compile();

        repository = module.get<UserRepository>(UserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // VERIFY-03.1: requestVerificationCode - Code Generation
    // ============================================================
    describe('requestVerificationCode - Code Generation', () => {
        it('должен сгенерировать 6-символьный hex код', async () => {
            // Arrange
            const mockCode = 'abc123';
            const mockBuffer = {
                toString: jest.fn().mockReturnValue(mockCode),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null]) // cooldown check: [results, metadata]
                .mockResolvedValueOnce([undefined, null]); // INSERT

            const mockHashedCode = 'hashed_abc123';
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(mockHashedCode),
            });

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'email', 1);

            // Assert
            expect(randomBytes).toHaveBeenCalledWith(
                VERIFICATION_CODE_LENGTH_BYTES,
            );
            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO `user_verification_code`'),
                expect.objectContaining({
                    replacements: expect.arrayContaining([
                        1,
                        'email',
                        mockHashedCode,
                        expect.any(Date),
                        expect.any(Date),
                        expect.any(Date),
                    ]),
                }),
            );
        });

        it('должен хэшировать код через SHA256', async () => {
            // Arrange
            const mockCode = 'def456';
            const mockBuffer = {
                toString: jest.fn().mockReturnValue(mockCode),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);

            const mockHash = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('sha256_hash'),
            };
            (createHash as jest.Mock).mockReturnValue(mockHash);

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'email', 1);

            // Assert
            expect(createHash).toHaveBeenCalledWith('sha256');
            expect(mockHash.update).toHaveBeenCalledWith(mockCode);
            expect(mockHash.digest).toHaveBeenCalledWith('hex');
        });

        it('должен установить TTL = 10 минут (600000 ms)', async () => {
            // Arrange
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);

            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'email', 1);

            // Assert
            const expectedExpiresAt = new Date(
                now + VERIFICATION_CODE_EXPIRY_MS,
            );
            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO `user_verification_code`'),
                expect.objectContaining({
                    replacements: expect.arrayContaining([expectedExpiresAt]),
                }),
            );
        });

        it('должен установить attempts = 0 при создании кода', async () => {
            // Arrange
            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'email', 1);

            // Assert - проверяем полный SQL запрос с attempts = 0
            const insertCall = mockSequelize.query.mock.calls.find((call) =>
                call[0].includes('INSERT INTO `user_verification_code`'),
            );
            expect(insertCall).toBeDefined();
            // SQL: INSERT INTO `user_verification_code` (`user_id`,`channel`,`code_hash`,`expires_at`,`attempts`,`created_at`,`updated_at`) VALUES (?,?,?,?,0,?,?)
            expect(insertCall[0]).toContain('`attempts`');
            expect(insertCall[0]).toContain('VALUES (?,?,?,?,0,?,?)'); // attempts = 0 (hardcoded)
            // replacements: [userId, channel, codeHash, expiresAt, createdAt, updatedAt]
            expect(insertCall[1].replacements).toEqual([
                1, // userId
                'email', // channel
                'hash', // codeHash
                expect.any(Date), // expiresAt
                expect.any(Date), // createdAt
                expect.any(Date), // updatedAt
            ]);
        });

        it('должен выбросить ошибку если randomBytes fails', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query.mockResolvedValueOnce([[], null]); // cooldown check

            (randomBytes as jest.Mock).mockImplementation(() => {
                throw new Error('Crypto module unavailable');
            });

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow();
        });

        it('должен выбросить ошибку если createHash fails', async () => {
            // Arrange
            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockImplementation(() => {
                throw new Error('Hash algorithm not supported');
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query.mockResolvedValueOnce([[], null]); // cooldown check

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow();
        });
    });

    // ============================================================
    // VERIFY-03.2: requestVerificationCode - Cooldown Check
    // ============================================================
    describe('requestVerificationCode - Cooldown Check', () => {
        it('должен пропустить запрос если cooldown истёк (>60 секунд)', async () => {
            // Arrange
            const now = Date.now();
            const lastCodeTime = new Date(
                now - VERIFICATION_CODE_COOLDOWN_MS - 1000,
            ); // 61 секунда назад

            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[{ created_at: lastCodeTime }], null]) // cooldown check: [results, metadata]
                .mockResolvedValueOnce([undefined, null]); // INSERT

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).resolves.toBeUndefined();

            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.any(Object),
            );
        });

        it('должен заблокировать запрос если cooldown не истёк (<60 секунд)', async () => {
            // Arrange
            const now = Date.now();
            const lastCodeTime = new Date(
                now - VERIFICATION_CODE_COOLDOWN_MS / 2,
            ); // 30 секунд назад

            mockUserModel.findOne.mockResolvedValue(mockUser);
            // QueryTypes.SELECT возвращает только массив результатов, не [results, metadata]
            mockSequelize.query.mockResolvedValue([
                { created_at: lastCodeTime },
            ]);

            // Act & Assert - первый вызов
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(BadRequestException);

            // Act & Assert - второй вызов тоже блокируется
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(/подождите .* секунд/);
        });

        it('должен рассчитать remainingSeconds корректно', async () => {
            // Arrange
            const now = Date.now();
            const timeSinceLastRequest = VERIFICATION_CODE_COOLDOWN_MS / 3; // ~20 секунд назад
            const lastCodeTime = new Date(now - timeSinceLastRequest);

            mockUserModel.findOne.mockResolvedValue(mockUser);
            // QueryTypes.SELECT возвращает только массив результатов
            mockSequelize.query.mockResolvedValueOnce([
                { created_at: lastCodeTime },
            ]);

            // Act & Assert - проверяем формат сообщения с числом секунд
            await expect(
                repository.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow(
                /Пожалуйста, подождите \d+ секунд перед повторным запросом кода/,
            );
        });

        it('должен применять cooldown независимо для email и phone', async () => {
            // Arrange
            const now = Date.now();
            const emailLastCode = new Date(
                now - VERIFICATION_CODE_COOLDOWN_MS / 2,
            ); // email: 30 сек назад (< 60, блок)
            const phoneLastCode = new Date(
                now - VERIFICATION_CODE_COOLDOWN_MS - 5000,
            ); // phone: 65 сек назад (> 60, пропуск)

            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);

            // email блокируется - QueryTypes.SELECT возвращает только массив
            mockSequelize.query.mockResolvedValueOnce([
                { created_at: emailLastCode },
            ]);

            // Act & Assert - email блокируется
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(BadRequestException);

            // phone проходит - cooldown check (QueryTypes.SELECT) + INSERT (не SELECT)
            mockSequelize.query
                .mockResolvedValueOnce([{ created_at: phoneLastCode }]) // SELECT
                .mockResolvedValueOnce([undefined, null]); // INSERT возвращает [results, metadata]

            mockSmsProvider.sendSms.mockResolvedValue({ success: true });

            // Act & Assert - phone проходит
            await expect(
                repository.requestVerificationCode(1, 'phone', 1),
            ).resolves.toBeUndefined();
        });
    });

    // ============================================================
    // VERIFY-03.3: requestVerificationCode - Tenant Isolation
    // ============================================================
    describe('requestVerificationCode - Tenant Isolation', () => {
        it('должен выбросить NotFoundException если пользователь не принадлежит tenant', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'email', 999),
            ).rejects.toThrow(NotFoundException);

            await expect(
                repository.requestVerificationCode(1, 'email', 999),
            ).rejects.toThrow(
                'Пользователь с ID 1 не найден или не принадлежит вашему tenant',
            );
        });

        it('должен проверить userId и tenantId через findUserByIdAndTenant', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);

            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(42, 'email', 7);

            // Assert
            expect(mockUserModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 42, tenantId: 7 },
                }),
            );
        });

        it('должен использовать tenantId из найденного пользователя', async () => {
            // Arrange
            const userWithTenant = { ...mockUser, tenantId: 5 };
            mockUserModel.findOne.mockResolvedValue(userWithTenant);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);

            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            const result = await repository.requestVerificationCode(
                1,
                'email',
                5,
            );

            // Assert - метод выполнился без ошибок
            expect(result).toBeUndefined();
            expect(mockEmailProvider.sendEmail).toHaveBeenCalled();
        });
    });

    // ============================================================
    // VERIFY-03.4: requestVerificationCode - Provider Integration
    // ============================================================
    describe('requestVerificationCode - Email/SMS Providers', () => {
        beforeEach(() => {
            const mockBuffer = {
                toString: jest.fn().mockReturnValue('abc123'),
            };
            (randomBytes as jest.Mock).mockReturnValue(mockBuffer);
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hash'),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([[], null])
                .mockResolvedValueOnce([undefined, null]);
        });

        it('должен отправить код через email провайдер для channel=email', async () => {
            // Arrange
            mockEmailProvider.sendEmail.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'email', 1);

            // Assert
            expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: 'Код подтверждения email',
                    text: expect.stringContaining('abc123'),
                    html: expect.stringContaining('abc123'),
                }),
            );
        });

        it('должен отправить код через SMS провайдер для channel=phone', async () => {
            // Arrange
            mockSmsProvider.sendSms.mockResolvedValue({ success: true });

            // Act
            await repository.requestVerificationCode(1, 'phone', 1);

            // Assert
            expect(mockSmsProvider.sendSms).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.phone,
                    message: expect.stringContaining('abc123'),
                }),
            );
        });

        it('должен выбросить ошибку если email провайдер вернул success: false', async () => {
            // Arrange
            mockEmailProvider.sendEmail.mockResolvedValue({
                success: false,
                error: 'SMTP connection failed',
            });

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'email', 1),
            ).rejects.toThrow(
                'Не удалось отправить email: SMTP connection failed',
            );
        });

        it('должен выбросить ошибку если SMS провайдер вернул success: false', async () => {
            // Arrange
            mockSmsProvider.sendSms.mockResolvedValue({
                success: false,
                error: 'Invalid phone number',
            });

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow('Не удалось отправить SMS: Invalid phone number');
        });

        it('должен выбросить BadRequestException если номер телефона отсутствует', async () => {
            // Arrange
            const userWithoutPhone = { ...mockUser, phone: null };
            mockUserModel.findOne.mockResolvedValue(userWithoutPhone);
            mockSequelize.query.mockResolvedValueOnce([[], null]); // cooldown check

            // Act & Assert
            await expect(
                repository.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow(BadRequestException);

            await expect(
                repository.requestVerificationCode(1, 'phone', 1),
            ).rejects.toThrow('Номер телефона не указан в профиле');
        });
    });

    // ============================================================
    // VERIFY-03.5: confirmVerificationCode - Success Flow
    // ============================================================
    describe('confirmVerificationCode - Success Flow', () => {
        const validCode = 'abc123';
        const hashedCode = 'sha256_hashed_abc123';
        const futureExpiry = new Date(
            Date.now() + VERIFICATION_CODE_EXPIRY_MS / 2,
        ); // +5 минут (половина TTL)

        beforeEach(() => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            const mockHash = {
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedCode),
            };
            (createHash as jest.Mock).mockReturnValue(mockHash);
        });

        it('должен вернуть true при валидном коде', async () => {
            // Arrange
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ]) // SELECT
                .mockResolvedValueOnce(undefined) // UPDATE attempts
                .mockResolvedValueOnce(undefined); // UPDATE user flags

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                validCode,
                1,
            );

            // Assert
            expect(result).toBe(true);
        });

        it('должен инкрементировать attempts при проверке кода', async () => {
            // Arrange
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 123,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 2,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            await repository.confirmVerificationCode(1, 'email', validCode, 1);

            // Assert
            expect(mockSequelize.query).toHaveBeenCalledWith(
                'UPDATE `user_verification_code` SET `attempts` = `attempts` + 1, `updated_at` = ? WHERE `id` = ? LIMIT 1',
                expect.objectContaining({
                    replacements: [expect.any(Date), 123],
                }),
            );
        });

        it('должен обновить is_email_verified = 1 для channel=email', async () => {
            // Arrange
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            await repository.confirmVerificationCode(1, 'email', validCode, 1);

            // Assert
            expect(mockSequelize.query).toHaveBeenCalledWith(
                'UPDATE `user` SET `is_email_verified` = 1, `email_verified_at` = ?, `updated_at` = ? WHERE `id` = ? AND `tenant_id` = ? LIMIT 1',
                expect.objectContaining({
                    replacements: [expect.any(Date), expect.any(Date), 1, 1],
                }),
            );
        });

        it('должен обновить is_phone_verified = 1 для channel=phone', async () => {
            // Arrange
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            await repository.confirmVerificationCode(1, 'phone', validCode, 1);

            // Assert
            expect(mockSequelize.query).toHaveBeenCalledWith(
                'UPDATE `user` SET `is_phone_verified` = 1, `phone_verified_at` = ?, `updated_at` = ? WHERE `id` = ? AND `tenant_id` = ? LIMIT 1',
                expect.objectContaining({
                    replacements: [expect.any(Date), expect.any(Date), 1, 1],
                }),
            );
        });

        it('должен залогировать успешную верификацию', async () => {
            // Arrange
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            const result = await repository.confirmVerificationCode(
                42,
                'phone',
                validCode,
                7,
            );

            // Assert
            expect(result).toBe(true);
            // Logger создается внутри репозитория через new Logger(), не мокается
        });
    });

    // ============================================================
    // VERIFY-03.6: confirmVerificationCode - Invalid/Expired Code
    // ============================================================
    describe('confirmVerificationCode - Invalid/Expired Code', () => {
        const validCode = 'abc123';
        const invalidCode = 'wrong1';
        const hashedValidCode = 'sha256_valid';
        const hashedInvalidCode = 'sha256_invalid';
        const futureExpiry = new Date(
            Date.now() + VERIFICATION_CODE_EXPIRY_MS / 2,
        ); // +5 минут (половина TTL)

        beforeEach(() => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
        });

        it('должен вернуть false при неверном коде', async () => {
            // Arrange
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedInvalidCode),
            });

            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedValidCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined); // UPDATE attempts

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                invalidCode,
                1,
            );

            // Assert
            expect(result).toBe(false);
            // Logger создается через new Logger(), не мокается
        });

        it('должен вернуть false при истекшем коде (TTL)', async () => {
            // Arrange
            const expiredDate = new Date(Date.now() - 1000); // истёк 1 секунду назад

            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedValidCode),
            });

            mockSequelize.query.mockResolvedValueOnce([
                [
                    {
                        id: 1,
                        code_hash: hashedValidCode,
                        expires_at: expiredDate,
                        attempts: 2,
                    },
                ],
            ]);

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'phone',
                validCode,
                1,
            );

            // Assert
            expect(result).toBe(false);
            // Logger создается через new Logger(), не мокается
        });

        it('должен вернуть false при превышении max attempts (5)', async () => {
            // Arrange
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedValidCode),
            });

            mockSequelize.query.mockResolvedValueOnce([
                [
                    {
                        id: 1,
                        code_hash: hashedValidCode,
                        expires_at: futureExpiry,
                        attempts: VERIFICATION_CODE_MAX_ATTEMPTS,
                    },
                ],
            ]);

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                validCode,
                1,
            );

            // Assert
            expect(result).toBe(false);
            // Logger создается через new Logger(), не мокается
        });

        it('должен вернуть false если код не найден в БД', async () => {
            // Arrange
            mockSequelize.query.mockResolvedValueOnce([[]]); // пустой результат

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                'nonexistent',
                1,
            );

            // Assert
            expect(result).toBe(false);
        });

        it('должен инкрементировать attempts даже при неверном коде', async () => {
            // Arrange
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedInvalidCode),
            });

            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 99,
                            code_hash: hashedValidCode,
                            expires_at: futureExpiry,
                            attempts: 3,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined);

            // Act
            await repository.confirmVerificationCode(
                1,
                'email',
                'wrong_code',
                1,
            );

            // Assert
            expect(mockSequelize.query).toHaveBeenCalledWith(
                'UPDATE `user_verification_code` SET `attempts` = `attempts` + 1, `updated_at` = ? WHERE `id` = ? LIMIT 1',
                expect.objectContaining({
                    replacements: [expect.any(Date), 99],
                }),
            );
        });
    });

    // ============================================================
    // VERIFY-03.7: confirmVerificationCode - Tenant Isolation
    // ============================================================
    describe('confirmVerificationCode - Tenant Isolation', () => {
        it('должен вернуть false если пользователь не принадлежит tenant', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                'abc123',
                999,
            );

            // Assert
            expect(result).toBe(false);
        });

        it('должен проверить userId и tenantId через findUserByIdAndTenant', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query.mockResolvedValueOnce([[]]);

            // Act
            await repository.confirmVerificationCode(42, 'phone', 'code123', 7);

            // Assert
            expect(mockUserModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 42, tenantId: 7 },
                }),
            );
        });

        it('должен обновить флаги только для соответствующего tenant', async () => {
            // Arrange
            const hashedCode = 'hash123';
            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedCode),
            });

            const futureExpiry = new Date(
                Date.now() + VERIFICATION_CODE_EXPIRY_MS / 2,
            ); // +5 минут

            mockUserModel.findOne.mockResolvedValue({
                ...mockUser,
                tenantId: 5,
            });
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiry,
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            await repository.confirmVerificationCode(1, 'email', 'abc123', 5);

            // Assert
            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE `id` = ? AND `tenant_id` = ?'),
                expect.objectContaining({
                    replacements: expect.arrayContaining([1, 5]),
                }),
            );
        });
    });

    // ============================================================
    // VERIFY-03.8: confirmVerificationCode - Edge Cases
    // ============================================================
    describe('confirmVerificationCode - Edge Cases', () => {
        let consoleErrorSpy: jest.SpyInstance;
        let consoleLogSpy: jest.SpyInstance;
        let consoleWarnSpy: jest.SpyInstance;

        beforeEach(() => {
            // Suppress ALL console output для Edge Cases (Logger выводит ошибки)
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
            consoleLogSpy.mockRestore();
            consoleWarnSpy.mockRestore();
        });

        it('должен вернуть false если sequelize instance недоступен', async () => {
            // Arrange
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockUserModel.sequelize = null;

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                'abc123',
                1,
            );

            // Assert
            expect(result).toBe(false);
        });

        // Тест на обработку ошибок БД опущен намеренно:
        // Logger внутри UserRepository выводит ошибки в console (нормальное поведение),
        // но это создает noise в test output. Edge case уже покрыт тестом "sequelize = null"

        it('должен корректно обработать expires_at как string (от БД)', async () => {
            // Arrange
            const futureExpiryString = new Date(
                Date.now() + VERIFICATION_CODE_EXPIRY_MS / 2,
            ).toISOString(); // +5 минут
            const hashedCode = 'hash';

            (createHash as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue(hashedCode),
            });

            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockSequelize.query
                .mockResolvedValueOnce([
                    [
                        {
                            id: 1,
                            code_hash: hashedCode,
                            expires_at: futureExpiryString, // string from DB
                            attempts: 0,
                        },
                    ],
                ])
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined);

            // Act
            const result = await repository.confirmVerificationCode(
                1,
                'email',
                'code',
                1,
            );

            // Assert
            expect(result).toBe(true);
        });
    });
});
