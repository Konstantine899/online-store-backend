import { IDecodedAccessToken } from '@app/domain/jwt';
import { getRoleLevel } from '@app/infrastructure/controllers/role/role-constants';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_LEVEL_KEY } from '../decorators/role-hierarchy.decorator';

/**
 * Guard для проверки иерархии ролей
 * Проверяет, что уровень роли пользователя >= требуемого уровня
 *
 * Использование:
 * ```typescript
 * @RequiredLevel(60) // Требуется уровень TENANT_ADMIN или выше
 * @UseGuards(AuthGuard, RoleHierarchyGuard)
 * @Post('roles/assign')
 * ```
 */
@Injectable()
export class RoleHierarchyGuard implements CanActivate {
    private readonly logger = new Logger(RoleHierarchyGuard.name);

    constructor(private readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            // Получить требуемый уровень из декоратора
            const requiredLevel = this.reflector.getAllAndOverride<number>(
                REQUIRED_LEVEL_KEY,
                [context.getHandler(), context.getClass()],
            );

            // Если уровень не указан, разрешаем доступ (guard не применяется)
            if (requiredLevel === undefined || requiredLevel === null) {
                return true;
            }

            // Получить пользователя из request (должен быть установлен AuthGuard)
            const request = context.switchToHttp().getRequest();
            const user = request.user as IDecodedAccessToken | undefined;

            if (!user) {
                this.logger.warn(
                    'RoleHierarchyGuard: Пользователь не найден в request. Убедитесь, что AuthGuard выполнен перед RoleHierarchyGuard.',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'Пользователь не авторизован',
                });
            }

            if (!user.roles || user.roles.length === 0) {
                this.logger.warn(
                    { userId: user.id },
                    'RoleHierarchyGuard: У пользователя нет ролей',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав доступа',
                });
            }

            // Получить высшую роль пользователя (первая роль в массиве обычно самая высокая)
            const userRole = user.roles[0]?.role;
            if (!userRole) {
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас недостаточно прав доступа',
                });
            }

            // Получить уровень роли пользователя
            const userRoleLevel = getRoleLevel(userRole);

            // Проверить, что уровень роли пользователя >= требуемого уровня
            if (userRoleLevel < requiredLevel) {
                this.logger.warn(
                    {
                        userId: user.id,
                        userRole,
                        userRoleLevel,
                        requiredLevel,
                    },
                    'RoleHierarchyGuard: Недостаточный уровень роли',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: `Требуется уровень роли ${requiredLevel} или выше. Ваш уровень: ${userRoleLevel}`,
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
                'RoleHierarchyGuard: Ошибка при проверке иерархии ролей',
            );
            throw new ForbiddenException({
                statusCode: HttpStatus.FORBIDDEN,
                message: `Ошибка проверки прав доступа: ${message}`,
            });
        }
    }
}
