import { IDecodedAccessToken } from '@app/domain/jwt';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
    IRequiredPermission,
    REQUIRED_PERMISSION_KEY,
} from '../decorators/role-hierarchy.decorator';

/**
 * Guard для проверки разрешений (resource + action)
 * Проверяет, что у пользователя есть требуемое разрешение в одной из его ролей
 *
 * Использование:
 * ```typescript
 * @RequiresPermission('users', 'manage')
 * @UseGuards(AuthGuard, PermissionGuard)
 * @Post('users')
 * ```
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly logger = new Logger(PermissionGuard.name);

    constructor(private readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            // Получить требуемое разрешение из декоратора
            const requiredPermission =
                this.reflector.getAllAndOverride<IRequiredPermission>(
                    REQUIRED_PERMISSION_KEY,
                    [context.getHandler(), context.getClass()],
                );

            // Если разрешение не указано, разрешаем доступ (guard не применяется)
            if (!requiredPermission) {
                return true;
            }

            const { resource, action } = requiredPermission;

            if (!resource || !action) {
                this.logger.warn(
                    'PermissionGuard: Некорректное разрешение в декораторе',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'Некорректная конфигурация разрешений',
                });
            }

            // Получить пользователя из request (должен быть установлен AuthGuard)
            const request = context.switchToHttp().getRequest();
            const user = request.user as IDecodedAccessToken | undefined;

            if (!user) {
                this.logger.warn(
                    'PermissionGuard: Пользователь не найден в request. Убедитесь, что AuthGuard выполнен перед PermissionGuard.',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'Пользователь не авторизован',
                });
            }

            if (!user.roles || user.roles.length === 0) {
                this.logger.warn(
                    { userId: user.id },
                    'PermissionGuard: У пользователя нет ролей',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав доступа',
                });
            }

            // Проверить, есть ли у хотя бы одной роли требуемое разрешение
            const hasPermission = user.roles.some((role) => {
                if (!role || typeof role.hasPermission !== 'function') {
                    return false;
                }
                return role.hasPermission(resource, action);
            });

            if (!hasPermission) {
                this.logger.warn(
                    {
                        userId: user.id,
                        resource,
                        action,
                        userRoles: user.roles.map((r) => r.role),
                    },
                    'PermissionGuard: У пользователя нет требуемого разрешения',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: `У вас нет разрешения на выполнение действия '${action}' над ресурсом '${resource}'`,
                });
            }

            return true;
        } catch (error: unknown) {
            // Пробрасываем ForbiddenException как есть
            if (error instanceof ForbiddenException) {
                throw error;
            }

            // Обрабатываем другие ошибки
            const message =
                error instanceof Error ? error.message : 'Неизвестная ошибка';
            this.logger.error(
                { error: message },
                'PermissionGuard: Ошибка при проверке разрешений',
            );
            throw new ForbiddenException({
                statusCode: HttpStatus.FORBIDDEN,
                message: `Ошибка проверки разрешений: ${message}`,
            });
        }
    }
}
