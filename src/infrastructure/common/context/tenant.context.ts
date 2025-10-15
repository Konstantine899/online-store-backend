import { Injectable, Scope } from '@nestjs/common';

/**
 * TenantContext - Request-scoped provider для хранения tenant ID
 *
 * Используется в repositories для автоматической фильтрации по tenant_id.
 * Создаётся для каждого HTTP запроса отдельно (Scope.REQUEST).
 *
 * @example
 * // В middleware:
 * tenantContext.setTenantId(1);
 *
 * // В repository:
 * const tenantId = tenantContext.getTenantId();
 * this.model.findAll({ where: { tenant_id: tenantId } });
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
    private tenantId: number | null = null;

    /**
     * Установить tenant ID для текущего запроса
     * @param tenantId - ID тенанта
     */
    setTenantId(tenantId: number): void {
        this.tenantId = tenantId;
    }

    /**
     * Получить tenant ID текущего запроса
     * @throws Error если tenant ID не установлен
     * @returns tenant ID
     */
    getTenantId(): number {
        if (this.tenantId === null) {
            throw new Error(
                'TenantContext: tenantId not set. Ensure TenantMiddleware is applied.',
            );
        }
        return this.tenantId;
    }

    /**
     * Получить tenant ID или null если не установлен
     * @returns tenant ID или null
     */
    getTenantIdOrNull(): number | null {
        return this.tenantId;
    }

    /**
     * Проверить установлен ли tenant ID
     * @returns true если tenant ID установлен
     */
    hasTenantId(): boolean {
        return this.tenantId !== null;
    }

    /**
     * Очистить tenant ID (для тестов)
     */
    clear(): void {
        this.tenantId = null;
    }
}
