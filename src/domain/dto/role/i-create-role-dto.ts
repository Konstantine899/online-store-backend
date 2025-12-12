/**
 * Domain interface для создания новой роли
 */
export interface ICreateRoleDto {
    /**
     * Название роли (UPPER_SNAKE_CASE)
     */
    role: string;

    /**
     * Описание роли
     */
    description: string;

    /**
     * Уровень иерархии (0-100)
     * 100 - высший уровень (SUPER_ADMIN)
     * 0 - нижний уровень
     */
    level?: number;

    /**
     * Разрешения роли
     * Массив объектов { resource, action, conditions? }
     */
    permissions?: unknown[];

    /**
     * Системная роль (true) или tenant-specific роль (false)
     */
    isSystemRole: boolean;

    /**
     * Активна ли роль (по умолчанию true)
     */
    isActive?: boolean;

    /**
     * ID тенанта (NULL для системных ролей, обязательно для tenant-specific)
     */
    tenantId?: number | null;
}
