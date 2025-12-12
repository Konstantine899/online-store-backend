import type { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { JwtSettings } from './jwt.settings.config';
import type { IJwtConfig } from '@app/domain/jwt';

export const jwtConfig = (): JwtModuleAsyncOptions => ({
    useFactory: (): IJwtConfig => {
        return {
            global: true, //  Это означает, что нам не нужно импортировать JwtModule куда-либо еще в нашем приложении.
            secret: JwtSettings().jwtSecretKey,
            signOptions: JwtSettings().expiresIn,
        };
    },
});
