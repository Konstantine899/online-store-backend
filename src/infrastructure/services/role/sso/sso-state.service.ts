import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import * as crypto from 'crypto';

/**
 * SSOStateService - Управление state parameter для SSO flow
 *
 * State parameter используется в OAuth 2.0/SAML/OIDC flow для передачи
 * контекста (tenantId, providerId) через провайдера и обратно в callback.
 *
 * Реализация:
 * - Генерация state с tenantId и providerId
 * - Валидация state при callback
 * - TTL для state (5 минут по умолчанию)
 * - Хранение в памяти (для production можно использовать Redis)
 * - Периодическая очистка истекших state (каждые 5 минут)
 */
@Injectable()
export class SSOStateService implements OnModuleDestroy {
    private readonly logger = createLogger('SSOStateService');
    private readonly stateStore = new Map<
        string,
        { tenantId: number; providerId: number; expiresAt: number }
    >();
    private readonly STATE_TTL_MS = 5 * 60 * 1000; // 5 минут
    private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 минут
    private cleanupInterval?: NodeJS.Timeout;

    constructor() {
        // Инициализируем периодическую очистку истекших state
        // Очистка каждые 5 минут предотвращает утечку памяти при низкой нагрузке
        if (process.env.NODE_ENV !== 'test') {
            this.cleanupInterval = setInterval(
                () => this.cleanupExpiredStates(),
                this.CLEANUP_INTERVAL_MS,
            );
            this.logger.debug(
                `Periodic cleanup initialized (interval: ${this.CLEANUP_INTERVAL_MS}ms)`,
            );
        }
    }

    /**
     * Lifecycle hook для очистки ресурсов при уничтожении модуля
     */
    onModuleDestroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
            this.logger.debug('SSOStateService cleanup interval cleared');
        }
    }

    /**
     * Генерирует state parameter с tenantId и providerId
     * @param tenantId - ID тенанта
     * @param providerId - ID провайдера (ExternalRoleConfig.id)
     * @returns state string для передачи в SSO flow
     */
    public generateState(tenantId: number, providerId: number): string {
        const state = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + this.STATE_TTL_MS;

        this.stateStore.set(state, {
            tenantId,
            providerId,
            expiresAt,
        });

        this.logger.debug(
            {
                state,
                tenantId,
                providerId,
                expiresAt: new Date(expiresAt).toISOString(),
            },
            'Generated SSO state',
        );

        // Дополнительная очистка истекших state при достижении порога (100 запросов)
        // Это дополняет периодическую очистку и помогает при высокой нагрузке
        if (this.stateStore.size % 100 === 0) {
            this.cleanupExpiredStates();
        }

        return state;
    }

    /**
     * Валидирует и извлекает данные из state parameter
     * @param state - state string из callback
     * @returns данные state или null если невалиден/истек
     */
    public validateState(
        state: string,
    ): { tenantId: number; providerId: number } | null {
        const stateData = this.stateStore.get(state);

        if (!stateData) {
            this.logger.warn({ state }, 'State not found');
            return null;
        }

        if (Date.now() > stateData.expiresAt) {
            this.logger.warn(
                { state, expiresAt: new Date(stateData.expiresAt).toISOString() },
                'State expired',
            );
            this.stateStore.delete(state);
            return null;
        }

        // Удаляем использованный state (одноразовый)
        this.stateStore.delete(state);

        this.logger.debug(
            {
                state,
                tenantId: stateData.tenantId,
                providerId: stateData.providerId,
            },
            'State validated successfully',
        );

        return {
            tenantId: stateData.tenantId,
            providerId: stateData.providerId,
        };
    }

    /**
     * Очистка истекших state из хранилища
     */
    private cleanupExpiredStates(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [state, data] of this.stateStore.entries()) {
            if (now > data.expiresAt) {
                this.stateStore.delete(state);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.debug({ cleaned }, 'Cleaned up expired states');
        }
    }

    /**
     * Получить количество активных state (для мониторинга)
     */
    public getActiveStatesCount(): number {
        return this.stateStore.size;
    }
}

