import { PromoCodeModel } from '@app/domain/models';
import { PromoCodeRepository } from '@app/infrastructure/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeService } from '../promo-code.service';

describe('PromoCodeService (Unit)', () => {
    let service: PromoCodeService;
    let mockPromoCodeRepository: {
        findByCode: jest.Mock;
        incrementUsageCount: jest.Mock;
    };

    beforeEach(async () => {
        mockPromoCodeRepository = {
            findByCode: jest.fn(),
            incrementUsageCount: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromoCodeService,
                {
                    provide: PromoCodeRepository,
                    useValue: mockPromoCodeRepository,
                },
            ],
        }).compile();

        service = module.get<PromoCodeService>(PromoCodeService);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('validatePromoCode', () => {
        describe('Успешная валидация', () => {
            it('должен валидировать активный промокод с процентной скидкой', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 1,
                    code: 'SUMMER20',
                    discount_type: 'PERCENT' as const,
                    discount_value: 20,
                    is_active: true,
                    valid_from: new Date('2025-01-01'),
                    valid_until: new Date('2025-12-31'),
                    usage_limit: 100,
                    usage_count: 50,
                    min_purchase_amount: 1000,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest
                        .fn()
                        .mockImplementation((amount: number) => amount >= 1000),
                    calculateDiscount: jest
                        .fn()
                        .mockImplementation((total: number) => total * 0.2),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'SUMMER20',
                    5000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: true,
                    discount: 1000, // 5000 * 0.2
                });
                expect(mockPromoCodeRepository.findByCode).toHaveBeenCalledWith(
                    'SUMMER20',
                );
                expect(mockPromoCode.hasStarted).toHaveBeenCalled();
                expect(mockPromoCode.isExpired).toHaveBeenCalled();
                expect(mockPromoCode.hasReachedLimit).toHaveBeenCalled();
                expect(mockPromoCode.meetsMinimumPurchase).toHaveBeenCalledWith(
                    5000,
                );
                expect(mockPromoCode.calculateDiscount).toHaveBeenCalledWith(
                    5000,
                );
            });

            it('должен валидировать активный промокод с фиксированной скидкой', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 2,
                    code: 'FIXED500',
                    discount_type: 'FIXED' as const,
                    discount_value: 500,
                    is_active: true,
                    valid_from: new Date('2025-01-01'),
                    valid_until: null,
                    usage_limit: null,
                    usage_count: 10,
                    min_purchase_amount: null,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest.fn().mockReturnValue(true),
                    calculateDiscount: jest.fn().mockReturnValue(500),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'FIXED500',
                    2000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: true,
                    discount: 500,
                });
            });
        });

        describe('Ошибки валидации', () => {
            it('должен вернуть ошибку если промокод не найден', async () => {
                // Arrange
                mockPromoCodeRepository.findByCode.mockResolvedValue(null);

                // Act
                const result = await service.validatePromoCode(
                    'NOTFOUND',
                    1000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage: 'Промокод не найден',
                });
            });

            it('должен вернуть ошибку если промокод неактивен', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 3,
                    code: 'INACTIVE',
                    is_active: false,
                    discount_type: 'PERCENT' as const,
                    discount_value: 10,
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'INACTIVE',
                    1000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage: 'Промокод неактивен',
                });
            });

            it('должен вернуть ошибку если промокод ещё не начал действовать', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 4,
                    code: 'FUTURE',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 15,
                    hasStarted: jest.fn().mockReturnValue(false),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode('FUTURE', 1000);

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage: 'Промокод ещё не начал действовать',
                });
            });

            it('должен вернуть ошибку если срок действия промокода истёк', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 5,
                    code: 'EXPIRED',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 25,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(true),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode('EXPIRED', 1000);

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage: 'Срок действия промокода истёк',
                });
            });

            it('должен вернуть ошибку если достигнут лимит использований', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 6,
                    code: 'LIMITREACHED',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 30,
                    usage_limit: 100,
                    usage_count: 100,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(true),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'LIMITREACHED',
                    1000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage: 'Достигнут лимит использований промокода',
                });
            });

            it('должен вернуть ошибку если не достигнута минимальная сумма покупки', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 7,
                    code: 'MINPURCHASE',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 15,
                    min_purchase_amount: 5000,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest.fn().mockReturnValue(false),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'MINPURCHASE',
                    2000,
                );

                // Assert
                expect(result).toEqual({
                    isValid: false,
                    discount: 0,
                    errorMessage:
                        'Минимальная сумма покупки для этого промокода: 5000 руб.',
                });
                expect(mockPromoCode.meetsMinimumPurchase).toHaveBeenCalledWith(
                    2000,
                );
            });
        });

        describe('Граничные случаи', () => {
            it('должен валидировать промокод с нулевой минимальной суммой', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 8,
                    code: 'NOMIN',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 10,
                    min_purchase_amount: null,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest.fn().mockReturnValue(true),
                    calculateDiscount: jest.fn().mockReturnValue(50),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode('NOMIN', 500);

                // Assert
                expect(result.isValid).toBe(true);
                expect(result.discount).toBe(50);
            });

            it('должен валидировать промокод без лимита использований', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 9,
                    code: 'UNLIMITED',
                    is_active: true,
                    discount_type: 'FIXED' as const,
                    discount_value: 100,
                    usage_limit: null,
                    usage_count: 999,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest.fn().mockReturnValue(true),
                    calculateDiscount: jest.fn().mockReturnValue(100),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'UNLIMITED',
                    2000,
                );

                // Assert
                expect(result.isValid).toBe(true);
                expect(result.discount).toBe(100);
            });

            it('должен валидировать промокод без даты окончания', async () => {
                // Arrange
                const mockPromoCode = {
                    id: 10,
                    code: 'NOEXPIRY',
                    is_active: true,
                    discount_type: 'PERCENT' as const,
                    discount_value: 5,
                    valid_until: null,
                    hasStarted: jest.fn().mockReturnValue(true),
                    isExpired: jest.fn().mockReturnValue(false),
                    hasReachedLimit: jest.fn().mockReturnValue(false),
                    meetsMinimumPurchase: jest.fn().mockReturnValue(true),
                    calculateDiscount: jest.fn().mockReturnValue(100),
                } as unknown as PromoCodeModel;

                mockPromoCodeRepository.findByCode.mockResolvedValue(
                    mockPromoCode,
                );

                // Act
                const result = await service.validatePromoCode(
                    'NOEXPIRY',
                    2000,
                );

                // Assert
                expect(result.isValid).toBe(true);
            });
        });
    });

    describe('applyPromoCode', () => {
        it('должен успешно применить промокод и инкрементировать счётчик', async () => {
            // Arrange
            const mockPromoCode = {
                id: 11,
                code: 'APPLY',
                usage_count: 10,
            } as unknown as PromoCodeModel;

            mockPromoCodeRepository.findByCode.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.incrementUsageCount.mockResolvedValue(
                mockPromoCode,
            );

            // Act
            await service.applyPromoCode('APPLY');

            // Assert
            expect(mockPromoCodeRepository.findByCode).toHaveBeenCalledWith(
                'APPLY',
            );
            expect(
                mockPromoCodeRepository.incrementUsageCount,
            ).toHaveBeenCalledWith(11);
        });

        it('должен выбросить ошибку если промокод не найден', async () => {
            // Arrange
            mockPromoCodeRepository.findByCode.mockResolvedValue(null);

            // Act & Assert
            await expect(service.applyPromoCode('NOTFOUND')).rejects.toThrow(
                'PromoCode with code "NOTFOUND" not found',
            );
            expect(
                mockPromoCodeRepository.incrementUsageCount,
            ).not.toHaveBeenCalled();
        });

        it('должен логировать успешное применение промокода', async () => {
            // Arrange
            const mockPromoCode = {
                id: 12,
                code: 'LOGTEST',
                usage_count: 5,
            } as unknown as PromoCodeModel;

            mockPromoCodeRepository.findByCode.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.incrementUsageCount.mockResolvedValue(
                mockPromoCode,
            );

            const logSpy = jest.spyOn(service['logger'], 'log');

            // Act
            await service.applyPromoCode('LOGTEST');

            // Assert
            expect(logSpy).toHaveBeenCalledWith('Applying promo code: LOGTEST');
            expect(logSpy).toHaveBeenCalledWith(
                'Promo code LOGTEST applied successfully. Usage count: 6',
            );
        });
    });

    describe('Интеграция валидации и применения', () => {
        it('должен корректно валидировать и применить промокод в полном цикле', async () => {
            // Arrange
            const mockPromoCode = {
                id: 13,
                code: 'FULLCYCLE',
                discount_type: 'PERCENT' as const,
                discount_value: 15,
                is_active: true,
                usage_count: 0,
                hasStarted: jest.fn().mockReturnValue(true),
                isExpired: jest.fn().mockReturnValue(false),
                hasReachedLimit: jest.fn().mockReturnValue(false),
                meetsMinimumPurchase: jest.fn().mockReturnValue(true),
                calculateDiscount: jest
                    .fn()
                    .mockImplementation((total: number) => total * 0.15),
            } as unknown as PromoCodeModel;

            mockPromoCodeRepository.findByCode.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.incrementUsageCount.mockResolvedValue(
                mockPromoCode,
            );

            // Act - Валидация
            const validationResult = await service.validatePromoCode(
                'FULLCYCLE',
                3000,
            );

            // Assert - Валидация
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.discount).toBe(450); // 3000 * 0.15

            // Act - Применение
            await service.applyPromoCode('FULLCYCLE');

            // Assert - Применение
            expect(
                mockPromoCodeRepository.incrementUsageCount,
            ).toHaveBeenCalledWith(13);
        });
    });
});
