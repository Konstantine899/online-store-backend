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
import { IDecodedAccessToken } from '@app/domain/jwt';
import { TokenService } from '@app/infrastructure/services/token/token.service';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private readonly tokenService: TokenService,
        private reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const requiredRoles = this.reflector.getAllAndOverride<string[]>(
                ROLES_KEY,
                [context.getHandler(), context.getClass()],
            );
            // если роли не найдены, то endpoint доступен для всех пользователей
            if (!requiredRoles) {
                return true;
            }

            const request = context.switchToHttp().getRequest();
            const authorizationHeader: string = request.headers.authorization;
            const bearer: string = authorizationHeader.split(' ')[0];
            const accessToken: string = authorizationHeader.split(' ')[1];

            if (bearer !== 'Bearer' || !accessToken) {
                throw new UnauthorizedException({
                    status: HttpStatus.UNAUTHORIZED,
                    message: 'Пользователь не авторизован',
                });
            }

            const user: IDecodedAccessToken =
                await this.tokenService.decodedAccessToken(
                    accessToken,
                    request,
                );
            return user.roles.some((role): boolean => {
                return requiredRoles.includes(role.role);
            });
        } catch (error) {
            throw new ForbiddenException({
                status: HttpStatus.FORBIDDEN,
                message: 'У вас не достаточно прав доступа',
            });
        }
    }
}
