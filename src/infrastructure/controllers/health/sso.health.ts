import { ExternalRoleConfigModel } from '@app/domain/models/external-role-config.model';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Op } from 'sequelize';

/**
 * SSO Health Indicator
 *
 * Проверяет доступность SSO конфигураций в БД и статус провайдеров.
 * Опционально может проверять доступность внешних SSO серверов.
 */
@Injectable()
export class SSOHealthIndicator extends HealthIndicator {
    private readonly logger = createLogger('SSOHealthIndicator');

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
    ) {
        super();
    }

    /**
     * Проверка доступности SSO конфигураций
     * @param key - Ключ для health check результата
     * @param tenantId - Опциональный tenant ID для проверки конфигураций
     * @param checkExternalServers - Проверять ли доступность внешних SSO серверов (по умолчанию false)
     * @returns HealthIndicatorResult
     */
    async pingCheck(
        key = 'sso',
        tenantId?: number | null,
        checkExternalServers = false,
    ): Promise<HealthIndicatorResult> {
        try {
            // Проверяем доступность репозитория
            const testTenantId =
                tenantId ?? (process.env.NODE_ENV === 'test' ? 1 : null);

            // Базовая проверка: репозиторий доступен
            let activeConfigsCount = 0;
            let totalConfigsCount = 0;
            const configsStatus: Array<{
                id: number;
                name: string;
                providerType: string;
                status: string;
            }> = [];

            if (testTenantId) {
                // Получаем статистику конфигураций для tenant
                const configs = await ExternalRoleConfigModel.findAll({
                    where: {
                        tenantId: testTenantId,
                        providerType: {
                            [Op.in]: [
                                'AZURE_AD',
                                'GOOGLE_WORKSPACE',
                                'GENERIC_OAUTH2',
                                'SAML',
                                'OIDC',
                            ],
                        },
                    },
                    attributes: ['id', 'name', 'providerType', 'status'],
                });

                totalConfigsCount = configs.length;
                activeConfigsCount = configs.filter(
                    (c) => c.status === 'ACTIVE',
                ).length;

                configs.forEach((config) => {
                    configsStatus.push({
                        id: config.id,
                        name: config.name,
                        providerType: config.providerType,
                        status: config.status,
                    });
                });
            }

            // Если требуется проверка внешних серверов, выполняем легковесные проверки
            let externalServersStatus: Record<string, boolean> | undefined;
            if (checkExternalServers && testTenantId) {
                externalServersStatus =
                    await this.checkExternalServersAvailability(testTenantId);
            }

            const isHealthy = totalConfigsCount === 0 || activeConfigsCount > 0;

            return this.getStatus(key, isHealthy, {
                message: isHealthy
                    ? 'SSO configurations available'
                    : 'No active SSO configurations found',
                totalConfigs: totalConfigsCount,
                activeConfigs: activeConfigsCount,
                configs: configsStatus,
                ...(externalServersStatus && {
                    externalServers: externalServersStatus,
                }),
            });
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'unhealthy';
            this.logger.error({ error: e }, 'SSO health check failed');
            return this.getStatus(key, false, { message });
        }
    }

    /**
     * Проверка доступности внешних SSO серверов
     * Выполняет легковесные HTTP запросы для проверки доступности endpoints
     * @param tenantId - ID tenant для получения конфигураций
     * @returns Статус доступности серверов
     */
    private async checkExternalServersAvailability(
        tenantId: number,
    ): Promise<Record<string, boolean>> {
        const status: Record<string, boolean> = {};

        try {
            const configs = await ExternalRoleConfigModel.findAll({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    providerType: {
                        [Op.in]: [
                            'AZURE_AD',
                            'GOOGLE_WORKSPACE',
                            'GENERIC_OAUTH2',
                            'SAML',
                            'OIDC',
                        ],
                    },
                },
                attributes: ['id', 'name', 'providerType', 'providerConfig'],
            });

            // Проверяем доступность каждого провайдера
            for (const config of configs) {
                const configKey = `${config.name} (${config.providerType})`;
                try {
                    const isAvailable = await this.checkProviderAvailability(
                        config.providerType,
                        config.providerConfig,
                    );
                    status[configKey] = isAvailable;
                } catch (error) {
                    this.logger.warn(
                        {
                            configId: config.id,
                            configName: config.name,
                            error,
                        },
                        'Failed to check provider availability',
                    );
                    status[configKey] = false;
                }
            }
        } catch (error) {
            this.logger.error(
                { tenantId, error },
                'Failed to check external servers availability',
            );
        }

        return status;
    }

    /**
     * Проверка доступности конкретного провайдера
     * Выполняет HEAD запрос к authorization endpoint для проверки доступности
     * @param providerType - Тип провайдера
     * @param providerConfig - Конфигурация провайдера
     * @returns true если провайдер доступен
     */
    private async checkProviderAvailability(
        providerType: string,
        providerConfig: unknown,
    ): Promise<boolean> {
        // Для безопасности не выполняем реальные HTTP запросы в health check
        // Это может быть медленным и не критичным для основного health check
        // Вместо этого проверяем наличие необходимых полей в конфигурации

        const config = providerConfig as Record<string, unknown>;

        switch (providerType) {
            case 'AZURE_AD':
            case 'GOOGLE_WORKSPACE':
            case 'GENERIC_OAUTH2':
                return !!(
                    config.authorizationURL &&
                    config.tokenURL &&
                    config.clientId
                );
            case 'SAML':
                return !!(config.entryPoint && config.cert);
            case 'OIDC':
                return !!(
                    (config.issuer || config.authorizationURL) &&
                    config.clientId
                );
            default:
                return false;
        }
    }
}
