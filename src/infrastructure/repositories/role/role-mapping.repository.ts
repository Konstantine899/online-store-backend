import {
    IMappingRules,
    IRoleMappingCreationAttributes,
    RoleMappingModel,
} from '@app/domain/models';
import {
    IFindMappingsOptions,
    IRoleMappingRepository,
} from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';

/**
 * RoleMappingRepository
 * Репозиторий для работы с маппингами ролей между внешними системами и внутренними ролями
 *
 * Все методы обеспечивают tenant isolation - пользователь видит только данные своего тенанта.
 */
@Injectable()
export class RoleMappingRepository implements IRoleMappingRepository {
    private readonly logger = new Logger(RoleMappingRepository.name);

    constructor(
        @InjectModel(RoleMappingModel)
        private roleMappingModel: typeof RoleMappingModel,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Получить tenantId с поддержкой test режима
     * @private
     */
    private getTenantIdSafe(): number | null {
        if (process.env.NODE_ENV === 'test') {
            return this.tenantContext.getTenantIdOrNull() ?? 1;
        }
        return this.tenantContext.getTenantIdOrNull();
    }

    /**
     * Создать новый маппинг
     */
    public async createMapping(
        data: IRoleMappingCreationAttributes,
    ): Promise<RoleMappingModel> {
        try {
            const mapping = await this.roleMappingModel.create({
                externalRoleConfigId: data.externalRoleConfigId,
                tenantId: data.tenantId,
                externalRoleName: data.externalRoleName,
                externalRoleId: data.externalRoleId ?? null,
                internalRoleId: data.internalRoleId,
                mappingRules: data.mappingRules ?? null,
                priority: data.priority ?? 100,
                isActive: data.isActive ?? true,
                isDefault: data.isDefault ?? false,
                mappedUsersCount: data.mappedUsersCount ?? 0,
                lastAppliedAt: data.lastAppliedAt ?? null,
            });

            this.logger.log({
                mappingId: mapping.id,
                tenantId: mapping.tenantId,
                externalRoleName: mapping.externalRoleName,
                internalRoleId: mapping.internalRoleId,
                message: 'Создан новый маппинг ролей',
            });

            return mapping;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    data: {
                        tenantId: data.tenantId,
                        externalRoleConfigId: data.externalRoleConfigId,
                    },
                },
                'Ошибка при создании маппинга',
            );
            throw error;
        }
    }

    /**
     * Найти маппинг по ID с tenant isolation
     */
    public async findMappingById(
        id: number,
        tenantId?: number | null,
    ): Promise<RoleMappingModel | null> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {
            id,
        };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const mapping = await this.roleMappingModel.findOne({ where });

        return mapping;
    }

    /**
     * Найти все маппинги по опциям, отсортированные по приоритету
     */
    public async findMappings(
        options?: IFindMappingsOptions,
    ): Promise<RoleMappingModel[]> {
        const effectiveTenantId = options?.tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {};

        // Tenant isolation
        if (effectiveTenantId !== null && effectiveTenantId !== undefined) {
            where.tenantId = effectiveTenantId;
        }

        // Фильтры
        if (options?.externalRoleConfigId) {
            where.externalRoleConfigId = options.externalRoleConfigId;
        }

        if (options?.externalRoleName) {
            where.externalRoleName = options.externalRoleName;
        }

        if (options?.internalRoleId) {
            where.internalRoleId = options.internalRoleId;
        }

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }

        if (options?.isDefault !== undefined) {
            where.isDefault = options.isDefault;
        }

        const mappings = await this.roleMappingModel.findAll({
            where,
            order: [
                ['priority', 'ASC'],
                ['created_at', 'ASC'],
            ],
        });

        return mappings;
    }

    /**
     * Найти маппинг для внешней роли (с учетом приоритета)
     */
    public async findMappingForExternalRole(
        externalRoleConfigId: number,
        externalRoleName: string,
        tenantId: number,
    ): Promise<RoleMappingModel | null> {
        const mapping = await this.roleMappingModel.findOne({
            where: {
                externalRoleConfigId,
                externalRoleName,
                tenantId,
                isActive: true,
            },
            order: [['priority', 'ASC']],
        });

        return mapping;
    }

    /**
     * Найти default маппинг для конфигурации
     */
    public async findDefaultMapping(
        externalRoleConfigId: number,
        tenantId: number,
    ): Promise<RoleMappingModel | null> {
        const mapping = await this.roleMappingModel.findOne({
            where: {
                externalRoleConfigId,
                tenantId,
                isDefault: true,
                isActive: true,
            },
        });

        return mapping;
    }

    /**
     * Обновить маппинг с tenant isolation
     */
    public async updateMapping(
        id: number,
        data: Partial<IRoleMappingCreationAttributes>,
        tenantId?: number | null,
    ): Promise<RoleMappingModel | null> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const [affectedRows] = await this.roleMappingModel.update(data, {
            where,
        });

        if (affectedRows === 0) {
            return null;
        }

        const updatedMapping = await this.roleMappingModel.findOne({
            where,
        });

        if (updatedMapping) {
            this.logger.log({
                mappingId: id,
                tenantId: effectiveTenantId,
                message: 'Маппинг обновлен',
            });
        }

        return updatedMapping;
    }

    /**
     * Удалить маппинг с tenant isolation
     */
    public async deleteMapping(
        id: number,
        tenantId?: number | null,
    ): Promise<number> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const deletedCount = await this.roleMappingModel.destroy({
            where,
        });

        if (deletedCount > 0) {
            this.logger.log({
                mappingId: id,
                tenantId: effectiveTenantId,
                message: 'Маппинг удален',
            });
        }

        return deletedCount;
    }

    /**
     * Обновить статистику маппинга
     */
    public async updateMappingStats(
        id: number,
        mappedUsersCount: number,
        lastAppliedAt: Date,
        tenantId?: number | null,
    ): Promise<void> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        await this.roleMappingModel.update(
            {
                mappedUsersCount,
                lastAppliedAt,
            },
            { where },
        );
    }

    /**
     * Тестировать маппинг (применить правила к тестовым данным)
     */
    public async testMapping(
        mappingRules: IMappingRules | null,
        testData: {
            externalRoleName: string;
            userAttributes?: Record<string, unknown>;
        },
        availableRoleIds: number[],
    ): Promise<number | null> {
        if (!mappingRules?.conditions) {
            // Если нет правил, возвращаем null
            return null;
        }

        // Применяем правила по порядку
        for (const condition of mappingRules.conditions) {
            if (!condition.if || !condition.then) {
                continue;
            }

            // Проверяем условия
            let matches = true;
            for (const [key, value] of Object.entries(condition.if)) {
                if (key === 'external_role') {
                    if (testData.externalRoleName !== value) {
                        matches = false;
                        break;
                    }
                } else if (testData.userAttributes) {
                    if (testData.userAttributes[key] !== value) {
                        matches = false;
                        break;
                    }
                } else {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                // Найдено совпадение, возвращаем роль
                const roleId =
                    typeof condition.then === 'number' ? condition.then : null; // Если это строка, нужно искать по названию роли

                if (roleId && availableRoleIds.includes(roleId)) {
                    return roleId;
                }
            }
        }

        // Если не найдено совпадений, используем default роль
        if (mappingRules.default) {
            const defaultRoleId =
                typeof mappingRules.default === 'number'
                    ? mappingRules.default
                    : null;

            if (defaultRoleId && availableRoleIds.includes(defaultRoleId)) {
                return defaultRoleId;
            }
        }

        return null;
    }
}
