import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { JwtSettings } from './jwt.settings.config';
import { IJwtConfig } from '../../../domain/jwt/i-jwt-config';

export const jwtConfig = (): JwtModuleAsyncOptions => ({
    useFactory: (): IJwtConfig => {
        return {
            global: true, //  Это означает, что нам не нужно импортировать JwtModule куда-либо еще в нашем приложении.
            secret: JwtSettings().jwtSecretKey,
            signOptions: JwtSettings().expiresIn,
        };
    },
});