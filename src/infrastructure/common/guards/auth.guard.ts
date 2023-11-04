import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtSettings } from '../../config/jwt/jwt.settings.config';
import { IHeaders } from '@app/domain/headers';
import { IDecodedAccessToken } from '@app/domain/jwt/i-decoded-access-token';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const { authorization }: IHeaders = request.headers;
            if (!authorization || authorization.trim() === '') {
                throw new UnauthorizedException('Please provide token');
            }
            const authToken = authorization.replace('Bearer', '').trim();
            request.decodedData = await this.decodeAccessToken(authToken);
            return true;
        } catch (error) {
            throw new ForbiddenException(
                `${error.message}! Please authorization` ||
                    'session expired! Please authorization',
            );
        }
    }

    private async decodeAccessToken(
        token: string,
    ): Promise<IDecodedAccessToken> {
        return await this.jwtService.verifyAsync(token, {
            secret: JwtSettings().jwtSecretKey,
        });
    }
}
