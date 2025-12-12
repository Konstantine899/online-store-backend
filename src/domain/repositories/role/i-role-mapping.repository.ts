import type {
    IMappingRules,
    IRoleMappingCreationAttributes,
    RoleMappingModel,
} from '@app/domain/models';

/**
 * Опции поиска маппингов
 */
export interface IFindMappingsOptions {
    externalRoleConfigId?: number;
    tenantId?: number;
    externalRoleName?: string;
    internalRoleId?: number;
    isActive?: boolean;
    isDefault?: boolean;
}

/**
 * Интерфейс репозитория для работы с маппингами ролей
 */
export interface IRoleMappingRepository {
    /**
     * Создать новый маппинг
     * @param data - Данные маппинга
     * @returns Созданный маппинг
     */
    createMapping(
        data: IRoleMappingCreationAttributes,
    ): Promise<RoleMappingModel>;

    /**
     * Найти маппинг по ID
     * @param id - ID маппинга
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Маппинг или null
     */
    findMappingById(
        id: number,
        tenantId?: number | null,
    ): Promise<RoleMappingModel | null>;

    /**
     * Найти все маппинги по опциям
     * @param options - Опции поиска
     * @returns Массив маппингов, отсортированных по приоритету
     */
    findMappings(
        options?: IFindMappingsOptions,
    ): Promise<RoleMappingModel[]>;

    /**
     * Найти маппинг для внешней роли (с учетом приоритета)
     * @param externalRoleConfigId - ID конфигурации
     * @param externalRoleName - Название внешней роли
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Найденный маппинг или null
     */
    findMappingForExternalRole(
        externalRoleConfigId: number,
        externalRoleName: string,
        tenantId: number,
    ): Promise<RoleMappingModel | null>;

    /**
     * Найти default маппинг для конфигурации
     * @param externalRoleConfigId - ID конфигурации
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Default маппинг или null
     */
    findDefaultMapping(
        externalRoleConfigId: number,
        tenantId: number,
    ): Promise<RoleMappingModel | null>;

    /**
     * Обновить маппинг
     * @param id - ID маппинга
     * @param data - Данные для обновления
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Обновленный маппинг или null
     */
    updateMapping(
        id: number,
        data: Partial<IRoleMappingCreationAttributes>,
        tenantId?: number | null,
    ): Promise<RoleMappingModel | null>;

    /**
     * Удалить маппинг
     * @param id - ID маппинга
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Количество удаленных записей
     */
    deleteMapping(id: number, tenantId?: number | null): Promise<number>;

    /**
     * Обновить статистику маппинга
     * @param id - ID маппинга
     * @param mappedUsersCount - Количество пользователей с этим маппингом
     * @param lastAppliedAt - Время последнего применения
     * @param tenantId - ID тенанта (для tenant isolation)
     */
    updateMappingStats(
        id: number,
        mappedUsersCount: number,
        lastAppliedAt: Date,
        tenantId?: number | null,
    ): Promise<void>;

    /**
     * Тестировать маппинг (применить правила к тестовым данным)
     * @param mappingRules - Правила маппинга для тестирования
     * @param testData - Тестовые данные внешней роли и пользователя
     * @returns Результат применения правил (ID внутренней роли или null)
     */
    testMapping(
        mappingRules: IMappingRules | null,
        testData: {
            externalRoleName: string;
            userAttributes?: Record<string, unknown>;
        },
        availableRoleIds: number[],
    ): Promise<number | null>;
}

