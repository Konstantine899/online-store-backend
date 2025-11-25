import { IDecodedAccessToken } from '@app/domain/jwt';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_TENANT_KEY } from '../decorators/role-hierarchy.decorator';

/**
 * Guard для проверки тенантской изоляции ролей
 * Проверяет, что пользователь имеет роль в указанном тенанте
 *
 * Использование:
 * ```typescript
 * @RequiresTenant()
 * @UseGuards(AuthGuard, TenantRoleGuard)
 * @Get('users')
 * ```
 */
@Injectable()
export class TenantRoleGuard implements CanActivate {
    private readonly logger = new Logger(TenantRoleGuard.name);

    constructor(
        private readonly roleService: RoleService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            // Проверить, требуется ли проверка тенанта
            const requiresTenant = this.reflector.getAllAndOverride<boolean>(
                REQUIRES_TENANT_KEY,
                [context.getHandler(), context.getClass()],
            );

            // Если проверка не требуется, разрешаем доступ
            if (!requiresTenant) {
                return true;
            }

            // Получить пользователя из request (должен быть установлен AuthGuard)
            const request = context.switchToHttp().getRequest();
            const user = request.user as IDecodedAccessToken | undefined;

            if (!user) {
                this.logger.warn(
                    'TenantRoleGuard: Пользователь не найден в request. Убедитесь, что AuthGuard выполнен перед TenantRoleGuard.',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'Пользователь не авторизован',
                });
            }

            if (!user.id) {
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'ID пользователя не найден',
                });
            }

            // Получить tenantId из разных источников (приоритет: user.tenantId > header > query)
            let tenantId: number | undefined = user.tenantId;

            if (!tenantId) {
                const headerTenantId = request.headers['x-tenant-id'];
                if (headerTenantId) {
                    tenantId = Number.parseInt(
                        Array.isArray(headerTenantId)
                            ? headerTenantId[0]
                            : headerTenantId,
                        10,
                    );
                }
            }

            if (!tenantId) {
                const queryTenantId = request.query?.tenant_id;
                if (queryTenantId) {
                    tenantId = Number.parseInt(
                        Array.isArray(queryTenantId)
                            ? queryTenantId[0]
                            : queryTenantId,
                        10,
                    );
                }
            }

            // Если tenantId не найден, выбрасываем ошибку
            if (!tenantId || Number.isNaN(tenantId)) {
                this.logger.warn(
                    { userId: user.id },
                    'TenantRoleGuard: Тенант не указан',
                );
                throw new BadRequestException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message:
                        'Тенант не указан. Укажите tenantId в заголовке x-tenant-id или в query параметре tenant_id',
                });
            }

            // Проверить, что пользователь имеет роль в этом тенанте
            const userRoles = await this.roleService.getUserRoles(
                user.id,
                tenantId,
            );

            if (!userRoles.roles || userRoles.roles.length === 0) {
                this.logger.warn(
                    {
                        userId: user.id,
                        tenantId,
                    },
                    'TenantRoleGuard: У пользователя нет ролей в указанном тенанте',
                );
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'У вас нет доступа к этому тенанту',
                });
            }

            // Сохранить tenantId в request для использования в контроллерах
            request.tenantId = tenantId;

            return true;
        } catch (error: unknown) {
            // Пробрасываем исключения как есть
            if (
                error instanceof ForbiddenException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }

            // Обрабатываем другие ошибки
            const message =
                error instanceof Error ? error.message : 'Неизвестная ошибка';
            this.logger.error(
                { error: message },
                'TenantRoleGuard: Ошибка при проверке тенантской изоляции',
            );
            throw new ForbiddenException({
                statusCode: HttpStatus.FORBIDDEN,
                message: `Ошибка проверки доступа к тенанту: ${message}`,
            });
        }
    }
}
