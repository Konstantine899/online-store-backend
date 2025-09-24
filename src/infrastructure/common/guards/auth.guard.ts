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
                throw new UnauthorizedException('Please provide token');
            }
            const authToken = authorization.replace('Bearer', '').trim();
            request.user = await this.tokenService.decodedAccessToken(
                authToken,
                request,
            );
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            throw new ForbiddenException({
                status: HttpStatus.FORBIDDEN,
                message: `${errorMessage}! Please authorization`,
            });
        }
    }
}
