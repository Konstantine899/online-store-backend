import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtSettingsConfig from '../../config/jwt/jwt.settings.config';
import { IDecodedPayload } from './role.guard';

interface IRequestHeaders {
    authorization: string;
    ['user-agent']: string;
    accept: string;
    host: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const { authorization }: IRequestHeaders = request.headers;
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

    private async validateAccessToken(token: string): Promise<IDecodedPayload> {
        return await this.jwtService.verifyAsync(token, {
            secret: jwtSettingsConfig().jwtSecretKey,
        });
    }
}
