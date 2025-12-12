/**
 * Unit тесты для SSOStateService
 * Покрывают управление state parameter для SSO flow
 *
 * Related to: SAAS-017-19, Этап 3
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { SSOStateService } from '../sso-state.service';

describe('SSOStateService (unit)', () => {
    let service: SSOStateService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SSOStateService],
        }).compile();

        service = module.get<SSOStateService>(SSOStateService);
    });

    afterEach(() => {
        // Очищаем state store после каждого теста
        jest.clearAllMocks();
        // Очищаем интервал если он был создан (для тестов с NODE_ENV !== 'test')
        if (service && typeof service.onModuleDestroy === 'function') {
            service.onModuleDestroy();
        }
    });

    // ============================================================================
    // TESTS: generateState()
    // ============================================================================

    describe('generateState', () => {
        it('должен генерировать уникальный state для tenantId и providerId', () => {
            const tenantId = 1;
            const providerId = 100;

            const state1 = service.generateState(tenantId, providerId);
            const state2 = service.generateState(tenantId, providerId);

            expect(state1).toBeDefined();
            expect(state2).toBeDefined();
            expect(state1).not.toBe(state2); // Должны быть разные
            expect(state1).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
            expect(state2).toMatch(/^[a-f0-9]{64}$/);
        });

        it('должен сохранять state в хранилище', () => {
            const tenantId = 1;
            const providerId = 100;

            const state = service.generateState(tenantId, providerId);
            expect(state).toBeDefined();
            expect(state).toMatch(/^[a-f0-9]{64}$/);

            const count = service.getActiveStatesCount();
            expect(count).toBeGreaterThan(0);
        });

        it('должен генерировать разные state для разных tenantId', () => {
            const providerId = 100;

            const state1 = service.generateState(1, providerId);
            const state2 = service.generateState(2, providerId);

            expect(state1).not.toBe(state2);
        });

        it('должен генерировать разные state для разных providerId', () => {
            const tenantId = 1;

            const state1 = service.generateState(tenantId, 100);
            const state2 = service.generateState(tenantId, 200);

            expect(state1).not.toBe(state2);
        });
    });

    // ============================================================================
    // TESTS: validateState()
    // ============================================================================

    describe('validateState', () => {
        it('должен валидировать и возвращать данные из валидного state', () => {
            const tenantId = 1;
            const providerId = 100;

            const state = service.generateState(tenantId, providerId);
            const result = service.validateState(state);

            expect(result).not.toBeNull();
            expect(result?.tenantId).toBe(tenantId);
            expect(result?.providerId).toBe(providerId);
        });

        it('должен возвращать null для несуществующего state', () => {
            const result = service.validateState('nonexistent-state-12345');

            expect(result).toBeNull();
        });

        it('должен удалять state после валидации (одноразовый)', () => {
            const tenantId = 1;
            const providerId = 100;

            const state = service.generateState(tenantId, providerId);
            const firstValidation = service.validateState(state);
            const secondValidation = service.validateState(state);

            expect(firstValidation).not.toBeNull();
            expect(secondValidation).toBeNull(); // State уже удален
        });

        it('должен возвращать null для истекшего state', () => {
            const tenantId = 1;
            const providerId = 100;

            const nowSpy = jest.spyOn(Date, 'now');
            const currentTime = Date.now();
            nowSpy.mockReturnValue(currentTime);

            const state = service.generateState(tenantId, providerId);

            // Симулируем истечение (6 минут, больше чем TTL 5 минут)
            nowSpy.mockReturnValue(currentTime + 6 * 60 * 1000);

            const result = service.validateState(state);

            expect(result).toBeNull();

            // Восстанавливаем
            nowSpy.mockRestore();
        });
    });

    // ============================================================================
    // TESTS: getActiveStatesCount()
    // ============================================================================

    describe('getActiveStatesCount', () => {
        it('должен возвращать 0 для пустого хранилища', () => {
            const count = service.getActiveStatesCount();
            expect(count).toBe(0);
        });

        it('должен возвращать количество активных state', () => {
            service.generateState(1, 100);
            service.generateState(1, 200);
            service.generateState(2, 100);

            const count = service.getActiveStatesCount();
            expect(count).toBe(3);
        });

        it('должен уменьшать счетчик после валидации state', () => {
            const state1 = service.generateState(1, 100);
            const state2 = service.generateState(1, 200);

            expect(service.getActiveStatesCount()).toBe(2);

            service.validateState(state1);

            expect(service.getActiveStatesCount()).toBe(1);
            // state2 остается активным после удаления state1
            expect(state2).toBeDefined();
        });
    });

    // ============================================================================
    // TESTS: cleanupExpiredStates()
    // ============================================================================

    describe('cleanupExpiredStates', () => {
        it('должен очищать истекшие state при достижении порога (100 записей)', () => {
            // Используем jest.spyOn для мокирования Date.now
            const nowSpy = jest.spyOn(Date, 'now');
            const currentTime = Date.now();

            // Устанавливаем текущее время
            nowSpy.mockReturnValue(currentTime);

            // Генерируем 99 state (чтобы следующий был 100-м и триггернул cleanup)
            for (let i = 0; i < 99; i++) {
                service.generateState(1, i);
            }

            // Симулируем истечение (6 минут) перед генерацией 100-го state
            nowSpy.mockReturnValue(currentTime + 6 * 60 * 1000);

            // Генерируем 100-й state для триггера cleanup
            // Все предыдущие state должны быть удалены как истекшие
            service.generateState(1, 200);

            // После cleanup истекшие state должны быть удалены
            const count = service.getActiveStatesCount();
            expect(count).toBe(1); // Только последний state остался

            // Восстанавливаем
            nowSpy.mockRestore();
        });

        it('должен очищать истекшие state при прямом вызове cleanupExpiredStates', () => {
            const nowSpy = jest.spyOn(Date, 'now');
            const currentTime = Date.now();

            // Генерируем state1 с текущим временем
            nowSpy.mockReturnValue(currentTime);
            const state1 = service.generateState(1, 100);

            // Генерируем state2 позже (через 1 минуту), чтобы он истекал позже
            const state2Time = currentTime + 1 * 60 * 1000;
            nowSpy.mockReturnValue(state2Time);
            const state2 = service.generateState(1, 200);

            expect(service.getActiveStatesCount()).toBe(2);

            // Устанавливаем время так, чтобы state1 истек (6 минут от его создания > 5 минут TTL)
            // но state2 еще активен (5 минут от его создания < 5 минут TTL)
            nowSpy.mockReturnValue(currentTime + 6 * 60 * 1000);

            // Вызываем cleanup напрямую через приватный метод (для тестирования)
            // @ts-expect-error - Доступ к приватному методу для тестирования
            service.cleanupExpiredStates();

            // state1 должен быть удален, state2 остаться
            expect(service.getActiveStatesCount()).toBe(1);

            // Проверяем, что state1 был удален cleanup (validateState вернет null для несуществующего state)
            expect(service.validateState(state1)).toBeNull();

            // Проверяем, что state2 валиден (state1 уже удален cleanup)
            const state2Data = service.validateState(state2);
            expect(state2Data).not.toBeNull();
            expect(state2Data?.tenantId).toBe(1);
            expect(state2Data?.providerId).toBe(200);

            nowSpy.mockRestore();
        });

        it('должен корректно обрабатывать cleanup когда нет истекших state', () => {
            const state1 = service.generateState(1, 100);
            const state2 = service.generateState(1, 200);

            const countBefore = service.getActiveStatesCount();
            expect(countBefore).toBe(2);

            // Вызываем cleanup (нет истекших state)
            // @ts-expect-error - Доступ к приватному методу для тестирования
            service.cleanupExpiredStates();

            // Количество не должно измениться
            const countAfter = service.getActiveStatesCount();
            expect(countAfter).toBe(2);
            expect(service.validateState(state1)).not.toBeNull();
            expect(service.validateState(state2)).not.toBeNull();
        });

        it('должен очищать все истекшие state при cleanup', () => {
            const nowSpy = jest.spyOn(Date, 'now');
            const currentTime = Date.now();

            // Генерируем несколько state
            nowSpy.mockReturnValue(currentTime);
            const state1 = service.generateState(1, 100);
            const state2 = service.generateState(1, 200);
            const state3 = service.generateState(1, 300);

            // Симулируем истечение для всех
            nowSpy.mockReturnValue(currentTime + 6 * 60 * 1000);

            // @ts-expect-error - Доступ к приватному методу для тестирования
            service.cleanupExpiredStates();

            // Все state должны быть удалены
            expect(service.getActiveStatesCount()).toBe(0);
            expect(service.validateState(state1)).toBeNull();
            expect(service.validateState(state2)).toBeNull();
            expect(service.validateState(state3)).toBeNull();

            nowSpy.mockRestore();
        });
    });

    // ============================================================================
    // TESTS: onModuleDestroy()
    // ============================================================================

    describe('onModuleDestroy', () => {
        it('должен корректно очищать интервал при уничтожении модуля', () => {
            // В тестовом окружении интервал не создается (NODE_ENV === 'test')
            // Но метод должен работать без ошибок
            expect(() => service.onModuleDestroy()).not.toThrow();
        });

        it('должен очищать cleanupInterval если он был установлен', () => {
            // Симулируем наличие cleanupInterval
            const mockInterval = setInterval(() => {}, 1000);
            // @ts-expect-error - Доступ к приватному полю для тестирования
            service.cleanupInterval = mockInterval;

            // Проверяем, что интервал установлен
            // @ts-expect-error - Доступ к приватному полю для тестирования
            expect(service.cleanupInterval).toBeDefined();

            // Вызываем onModuleDestroy
            service.onModuleDestroy();

            // Интервал должен быть очищен
            // @ts-expect-error - Доступ к приватному полю для тестирования
            expect(service.cleanupInterval).toBeUndefined();

            // Очищаем мок интервал
            clearInterval(mockInterval);
        });
    });

    describe('constructor', () => {
        it('не должен создавать интервал в тестовом окружении (NODE_ENV=test)', () => {
            // В тестовом окружении интервал не создается
            // Проверяем, что cleanupInterval не установлен для существующего сервиса
            // @ts-expect-error - Доступ к приватному полю для тестирования
            expect(service.cleanupInterval).toBeUndefined();
        });
    });
});
