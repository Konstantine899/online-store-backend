import { RoleMappingModel } from '@app/domain/models';
import { IRoleMappingRepository } from '@app/domain/repositories';
import { IRoleService } from '@app/domain/services/role/i-role-service';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { Inject, Injectable } from '@nestjs/common';
import {
    IMappingEvaluationContext,
    MappingRuleEngine,
} from './mapping-rule-engine';

/**
 * Результат применения маппингов
 */
export interface IApplyMappingsResult {
    /** Количество примененных маппингов */
    applied: number;
    /** Количество ошибок */
    errors: number;
    /** Примененные роли */
    appliedRoles: Array<{
        mappingId: number;
        roleId: number;
        roleName?: string;
    }>;
    /** Использована ли default роль */
    usedDefault: boolean;
    /** Детали ошибок (если были) */
    errorDetails?: Array<{
        mappingId: number;
        roleId?: number;
        error: string;
    }>;
}

/**
 * RoleMappingService - Централизованный сервис для применения маппингов ролей
 *
 * Обеспечивает:
 * - Централизованную логику применения маппингов
 * - Интеграцию с MappingRuleEngine для оценки правил
 * - Обработку приоритетов
 * - Применение default роли
 * - Обновление статистики маппингов
 *
 * Используется в:
 * - SSORoleSyncService
 * - LDAPRoleSyncService
 * - ExternalRoleSyncService (будущий)
 */
@Injectable()
export class RoleMappingService {
    private readonly logger = createLogger('RoleMappingService');

    constructor(
        @Inject('IRoleService')
        private readonly roleService: IRoleService,
        @Inject('IRoleMappingRepository')
        private readonly roleMappingRepository: IRoleMappingRepository,
        private readonly mappingRuleEngine: MappingRuleEngine,
    ) {}

    /**
     * Применить маппинги ролей к пользователю
     * @param userId - ID пользователя
     * @param externalRoles - Роли из внешней системы
     * @param userAttributes - Атрибуты пользователя из SSO/LDAP (department, location и т.д.)
     * @param configId - ID конфигурации внешней системы
     * @param tenantId - ID тенанта
     * @returns Результат применения маппингов
     */
    public async applyMappings(
        userId: number,
        externalRoles: string[],
        userAttributes: Record<string, unknown> | undefined,
        configId: number,
        tenantId: number,
    ): Promise<IApplyMappingsResult> {
        this.logger.debug(
            {
                userId,
                externalRoles,
                configId,
                tenantId,
            },
            'Applying role mappings',
        );

        const result: IApplyMappingsResult = {
            applied: 0,
            errors: 0,
            appliedRoles: [],
            usedDefault: false,
            errorDetails: [],
        };

        try {
            // Получаем все активные маппинги для этой конфигурации
            const activeMappings =
                await this.roleMappingRepository.findMappings({
                    externalRoleConfigId: configId,
                    tenantId,
                    isActive: true,
                });

            if (activeMappings.length === 0) {
                this.logger.debug(
                    { configId, tenantId },
                    'No active role mappings found',
                );
                return result;
            }

            // Если нет внешних ролей, нечего применять
            if (externalRoles.length === 0) {
                this.logger.debug(
                    { userId, configId, tenantId },
                    'No external roles provided',
                );
                return result;
            }

            // Получаем текущие роли пользователя
            const userRolesResponse = await this.roleService.getUserRoles(
                userId,
                tenantId,
            );
            const userRoleIds = userRolesResponse.roles.map((r) => r.roleId);
            const userRoleNames = userRolesResponse.roles.map(
                (r) => r.roleName,
            );

            // Находим применимые маппинги
            const applicableMappings = await this.findApplicableMappings(
                externalRoles,
                userAttributes,
                activeMappings,
                tenantId,
            );

            if (applicableMappings.length === 0) {
                // Пробуем применить default роль
                const defaultResult = await this.applyDefaultRole(
                    userId,
                    activeMappings,
                    userRoleIds,
                    userRoleNames,
                    tenantId,
                );

                if (defaultResult) {
                    result.applied = 1;
                    result.appliedRoles.push(defaultResult);
                    result.usedDefault = true;
                }

                return result;
            }

            // Сортируем по приоритету (меньше = выше приоритет)
            applicableMappings.sort(
                (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
            );

            // Разрешаем конфликты (если несколько маппингов с одинаковым приоритетом)
            const resolvedMappings =
                this.resolveMappingConflicts(applicableMappings);

            // Фильтруем маппинги, которые нужно применить (исключаем уже назначенные роли)
            const mappingsToApply = resolvedMappings.filter(
                (mapping) => !userRoleIds.includes(mapping.internalRoleId),
            );

            if (mappingsToApply.length === 0) {
                this.logger.debug(
                    { userId, applicableMappings: applicableMappings.length },
                    'All applicable roles already assigned',
                );
                return result;
            }

            // Применяем маппинги параллельно
            const applyPromises = mappingsToApply.map(async (mapping) => {
                try {
                    await this.roleService.assignRoleToUser(
                        {
                            userId,
                            roleId: mapping.internalRoleId,
                            tenantId,
                        },
                        tenantId,
                        userRoleNames,
                    );

                    // Обновляем статистику маппинга
                    await this.roleMappingRepository.updateMappingStats(
                        mapping.id,
                        mapping.mappedUsersCount + 1,
                        new Date(),
                        tenantId,
                    );

                    this.logger.info(
                        {
                            userId,
                            externalRole: mapping.externalRoleName,
                            internalRoleId: mapping.internalRoleId,
                            mappingId: mapping.id,
                        },
                        'Role applied via mapping',
                    );

                    return {
                        mappingId: mapping.id,
                        roleId: mapping.internalRoleId,
                        roleName: undefined, // Можно расширить при необходимости
                    };
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);

                    this.logger.warn(
                        {
                            error: errorMessage,
                            userId,
                            mappingId: mapping.id,
                        },
                        'Failed to apply role mapping',
                    );

                    throw error; // Пробрасываем для Promise.allSettled
                }
            });

            // Используем Promise.allSettled для обработки всех маппингов
            const results = await Promise.allSettled(applyPromises);

            results.forEach((settledResult, index) => {
                if (settledResult.status === 'fulfilled') {
                    result.applied++;
                    result.appliedRoles.push(settledResult.value);
                } else {
                    result.errors++;
                    const mapping = mappingsToApply[index];
                    const errorMessage =
                        settledResult.reason instanceof Error
                            ? settledResult.reason.message
                            : String(settledResult.reason);
                    result.errorDetails?.push({
                        mappingId: mapping.id,
                        roleId: mapping.internalRoleId,
                        error: errorMessage,
                    });
                }
            });

            if (result.errors > 0) {
                // Удаляем пустой массив errorDetails если нет ошибок
                if (result.errorDetails && result.errorDetails.length === 0) {
                    delete result.errorDetails;
                }

                this.logger.warn(
                    {
                        userId,
                        total: mappingsToApply.length,
                        failed: result.errors,
                        succeeded: result.applied,
                        errorDetails: result.errorDetails,
                    },
                    'Some role mappings failed to apply',
                );
            } else {
                // Удаляем пустой массив errorDetails если нет ошибок
                delete result.errorDetails;
            }

            return result;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                {
                    error: errorMessage,
                    userId,
                    externalRoles,
                    configId,
                },
                'Failed to apply role mappings',
            );

            throw error;
        }
    }

    /**
     * Найти применимые маппинги для внешних ролей
     * @param externalRoles - Роли из внешней системы
     * @param userAttributes - Атрибуты пользователя
     * @param mappings - Все маппинги
     * @param tenantId - ID тенанта (для поиска роли по имени)
     * @returns Массив применимых маппингов
     */
    private async findApplicableMappings(
        externalRoles: string[],
        userAttributes: Record<string, unknown> | undefined,
        mappings: RoleMappingModel[],
        tenantId: number,
    ): Promise<RoleMappingModel[]> {
        const applicableMappings: RoleMappingModel[] = [];

        for (const mapping of mappings) {
            // Проверяем простое совпадение по externalRoleName
            if (externalRoles.includes(mapping.externalRoleName)) {
                // Если есть mappingRules, оцениваем их
                if (mapping.mappingRules) {
                    const context: IMappingEvaluationContext = {
                        externalRoleName: mapping.externalRoleName,
                        userAttributes,
                    };

                    const evaluationResult = this.mappingRuleEngine.evaluate(
                        mapping.mappingRules,
                        context,
                    );

                    // Если правило не совпало, пропускаем этот маппинг
                    if (!evaluationResult?.matched) {
                        continue;
                    }

                    // Если в правиле указан roleId, используем его вместо mapping.internalRoleId
                    // Это позволяет переопределить роль через правила
                    if (evaluationResult.roleId) {
                        // Создаем безопасный маппинг с переопределенным roleId
                        const mappingWithRoleId =
                            this.createMappingWithRoleId(
                                mapping,
                                evaluationResult.roleId,
                            );
                        applicableMappings.push(mappingWithRoleId);
                        continue;
                    }

                    // Если указано roleName, находим ID роли
                    if (evaluationResult.roleName) {
                        try {
                            const roleResponse =
                                await this.roleService.getRole(
                                    evaluationResult.roleName,
                                    tenantId,
                                );
                            const mappingWithRoleId =
                                this.createMappingWithRoleId(
                                    mapping,
                                    roleResponse.id,
                                );
                            applicableMappings.push(mappingWithRoleId);
                            continue;
                        } catch (error: unknown) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : String(error);
                            this.logger.warn(
                                {
                                    roleName: evaluationResult.roleName,
                                    mappingId: mapping.id,
                                    error: errorMessage,
                                },
                                'Failed to resolve role by name, using mapping.internalRoleId',
                            );
                            // Fallback: используем исходный маппинг
                        }
                    }
                }

                // Добавляем маппинг (без правил или с совпавшими правилами)
                applicableMappings.push(mapping);
            }
        }

        return applicableMappings;
    }

    /**
     * Создать безопасную копию маппинга с переопределенным roleId
     * Использует Object.assign для избежания проблем с Sequelize моделью
     * @param mapping - Исходный маппинг
     * @param roleId - Новый roleId
     * @returns Маппинг с переопределенным roleId
     */
    private createMappingWithRoleId(
        mapping: RoleMappingModel,
        roleId: number,
    ): RoleMappingModel {
        // Создаем новый объект с переопределенным internalRoleId
        // Используем Object.assign для безопасного клонирования
        return Object.assign(Object.create(Object.getPrototypeOf(mapping)), {
            ...mapping,
            internalRoleId: roleId,
        }) as RoleMappingModel;
    }

    /**
     * Разрешить конфликты маппингов
     * В текущей реализации возвращает все маппинги (они уже отсортированы по приоритету)
     * Приоритет используется для определения порядка применения, а не для фильтрации
     * @param mappings - Маппинги, отсортированные по приоритету
     * @returns Все маппинги (применяются в порядке приоритета)
     */
    private resolveMappingConflicts(
        mappings: RoleMappingModel[],
    ): RoleMappingModel[] {
        // Возвращаем все маппинги - они уже отсортированы по приоритету
        // Приоритет определяет порядок применения, но не фильтрует маппинги
        return mappings;
    }

    /**
     * Применить default роль, если нет совпадений
     * @param userId - ID пользователя
     * @param mappings - Все маппинги
     * @param userRoleIds - Текущие роли пользователя
     * @param userRoleNames - Названия текущих ролей пользователя
     * @param tenantId - ID тенанта
     * @returns Результат применения или null
     */
    private async applyDefaultRole(
        userId: number,
        mappings: RoleMappingModel[],
        userRoleIds: number[],
        userRoleNames: string[],
        tenantId: number,
    ): Promise<{
        mappingId: number;
        roleId: number;
        roleName?: string;
    } | null> {
        // Ищем маппинг с isDefault = true
        const defaultMapping = mappings.find((m) => m.isDefault === true);

        if (!defaultMapping) {
            return null;
        }

        // Проверяем, не назначена ли уже эта роль
        if (userRoleIds.includes(defaultMapping.internalRoleId)) {
            return null;
        }

        try {
            await this.roleService.assignRoleToUser(
                {
                    userId,
                    roleId: defaultMapping.internalRoleId,
                    tenantId,
                },
                tenantId,
                userRoleNames,
            );

            // Обновляем статистику
            await this.roleMappingRepository.updateMappingStats(
                defaultMapping.id,
                defaultMapping.mappedUsersCount + 1,
                new Date(),
                tenantId,
            );

            this.logger.info(
                {
                    userId,
                    mappingId: defaultMapping.id,
                    roleId: defaultMapping.internalRoleId,
                },
                'Default role applied via mapping',
            );

            return {
                mappingId: defaultMapping.id,
                roleId: defaultMapping.internalRoleId,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.warn(
                {
                    error: errorMessage,
                    userId,
                    mappingId: defaultMapping.id,
                },
                'Failed to apply default role mapping',
            );

            return null;
        }
    }
}
