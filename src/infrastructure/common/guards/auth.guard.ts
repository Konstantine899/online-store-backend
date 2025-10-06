import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { IHeaders } from '@app/domain/headers';
import { TokenService } from '@app/infrastructure/services/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const { authorization }: IHeaders = request.headers;
            if (!authorization || authorization.trim() === '') {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'Пользователь не авторизован',
                });
            }
            const authToken = authorization.replace('Bearer', '').trim();
            request.user = await this.tokenService.decodedAccessToken(
                authToken,
                request,
            );
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error; // Пробрасываем уже сформированные ошибки
            }

            const errorMessage =
                error instanceof Error ? error.message : 'Неизвестная ошибка';
            throw new ForbiddenException({
                statusCode: HttpStatus.FORBIDDEN,
                message: `Ошибка авторизации: ${errorMessage}`,
            });
        }
    }
}
