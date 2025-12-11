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
    });
});
