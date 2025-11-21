/**
 * Domain interface для обновления существующей роли
 *
 * Все поля опциональны - можно обновить только нужные поля
 */
export interface IUpdateRoleDto {
    /**
     * Новое название роли (UPPER_SNAKE_CASE)
     */
    role?: string;

    /**
     * Новое описание роли
     */
    description?: string;

    /**
     * Новый уровень иерархии (0-100)
     * 100 - высший уровень (SUPER_ADMIN)
     * 0 - нижний уровень
     */
    level?: number;

    /**
     * Новые разрешения роли
     * Массив объектов { resource, action, conditions? }
     */
    permissions?: unknown[];

    /**
     * Активна ли роль
     */
    isActive?: boolean;

    /**
     * ID тенанта (NULL для системных ролей)
     */
    tenantId?: number | null;
}
