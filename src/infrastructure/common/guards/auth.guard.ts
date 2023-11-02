import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtSettings } from '../../config/jwt/jwt.settings.config';
import { IHeaders } from '../../../domain/headers/i-headers';
import { IDecodedAccessToken } from '../../../domain/jwt/i-decoded-access-token';

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
            const decodedAccessToken =
                await this.validateAccessToken(authToken);
            request.decodedData = decodedAccessToken;
            return true;
        } catch (error) {
            throw new ForbiddenException(
                `${error.message}! Please authorization` ||
                    'session expired! Please authorization',
            );
        }
    }

    private async validateAccessToken(
        token: string,
    ): Promise<IDecodedAccessToken> {
        return await this.jwtService.verifyAsync(token, {
            secret: JwtSettings().jwtSecretKey,
        });
    }
}
