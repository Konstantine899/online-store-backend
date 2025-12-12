import { SetMetadata } from '@nestjs/common';

/**
 * Ключ метаданных для требуемого уровня роли
 */
export const REQUIRED_LEVEL_KEY = 'required_level';

/**
 * Декоратор для указания минимального уровня роли для доступа
 * Используется с RoleHierarchyGuard
 *
 * @param level - Минимальный уровень роли (0-100)
 * @example
 * ```typescript
 * @RequiredLevel(60) // Требуется уровень TENANT_ADMIN или выше
 * @UseGuards(AuthGuard, RoleHierarchyGuard)
 * @Post('roles/assign')
 * ```
 */
export const RequiredLevel = (level: number): MethodDecorator => {
    if (level < 0 || level > 100) {
        throw new Error('Уровень роли должен быть в диапазоне от 0 до 100');
    }
    return SetMetadata(REQUIRED_LEVEL_KEY, level);
};

/**
 * Ключ метаданных для требуемого разрешения
 */
export const REQUIRED_PERMISSION_KEY = 'required_permission';

/**
 * Интерфейс для требуемого разрешения
 */
export interface IRequiredPermission {
    resource: string;
    action: string;
}

/**
 * Декоратор для указания требуемого разрешения (resource + action)
 * Используется с PermissionGuard
 *
 * @param resource - Ресурс (например, 'users', 'products', 'orders')
 * @param action - Действие (например, 'read', 'write', 'delete', 'manage')
 * @example
 * ```typescript
 * @RequiresPermission('users', 'manage')
 * @UseGuards(AuthGuard, PermissionGuard)
 * @Post('users')
 * ```
 */
export const RequiresPermission = (
    resource: string,
    action: string,
): MethodDecorator => {
    return SetMetadata(REQUIRED_PERMISSION_KEY, {
        resource,
        action,
    } as IRequiredPermission);
};

/**
 * Ключ метаданных для требования наличия тенанта
 */
export const REQUIRES_TENANT_KEY = 'requires_tenant';

/**
 * Декоратор для указания обязательности наличия тенанта
 * Используется с TenantRoleGuard
 *
 * @example
 * ```typescript
 * @RequiresTenant()
 * @UseGuards(AuthGuard, TenantRoleGuard)
 * @Get('users')
 * ```
 */
export const RequiresTenant = (): MethodDecorator => {
    return SetMetadata(REQUIRES_TENANT_KEY, true);
};
