import { IDecodedAccessToken } from '@app/domain/jwt';
import { TokenService } from '@app/infrastructure/services/token/token.service';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles-auth.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
    private static readonly BEARER_PREFIX = 'Bearer ';
    private static readonly UNAUTHORIZED_MESSAGE =
        'Пользователь не авторизован';
    private static readonly FORBIDDEN_MESSAGE =
        'У вас недостаточно прав доступа';

    private readonly roleSetsCache = new Map<string, Set<string>>();

    constructor(
        private readonly tokenService: TokenService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const method = request.method;
            const url = request.url;

            const requiredRoles = this.reflector.getAllAndOverride<string[]>(
                ROLES_KEY,
                [context.getHandler(), context.getClass()],
            );
            // если роли не найдены, то endpoint доступен для всех пользователей
            if (!requiredRoles) {
                console.log(
                    `RoleGuard: No roles required for ${method} ${url}`,
                );
                return true;
            }
            const authorizationHeader = request.headers.authorization as
                | string
                | undefined;

            if (!authorizationHeader) {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: RoleGuard.UNAUTHORIZED_MESSAGE,
                });
            }

            if (!authorizationHeader.startsWith(RoleGuard.BEARER_PREFIX)) {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: RoleGuard.UNAUTHORIZED_MESSAGE,
                });
            }

            const accessToken = authorizationHeader.slice(
                RoleGuard.BEARER_PREFIX.length,
            );
            if (!accessToken) {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: RoleGuard.UNAUTHORIZED_MESSAGE,
                });
            }

            const user: IDecodedAccessToken =
                await this.tokenService.decodedAccessToken(
                    accessToken,
                    request,
                );

            if (!user.roles?.length) {
                throw new ForbiddenException({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: RoleGuard.FORBIDDEN_MESSAGE,
                });
            }

            const requiredSet = this.getRoleSet(requiredRoles);
            return user.roles.some((role) => requiredSet.has(role.role));
        } catch (error) {
            if (
                error instanceof UnauthorizedException ||
                error instanceof ForbiddenException
            ) {
                throw error;
            }

            const message =
                error instanceof Error ? error.message : 'Неизвестная ошибка';
            throw new ForbiddenException({
                statusCode: HttpStatus.FORBIDDEN,
                message: `Ошибка авторизации: ${message}`,
            });
        }
    }

    private getRoleSet(roles: string[]): Set<string> {
        const key = roles.sort().join(',');
        if (!this.roleSetsCache.has(key)) {
            this.roleSetsCache.set(key, new Set(roles));
        }
        const cached = this.roleSetsCache.get(key);
        if (!cached) {
            throw new Error(`Failed to get cached role set for key: ${key}`);
        }
        return cached;
    }
}
