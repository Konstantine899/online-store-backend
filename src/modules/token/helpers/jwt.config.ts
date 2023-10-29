import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import jwtSettingsConfig, { IExpiresIn } from './jwt.settings.config';

interface IJwtConfig {
    secret: string;
    signOptions: IExpiresIn;
}

export const jwtConfig = (): JwtModuleAsyncOptions => ({
    useFactory: (): IJwtConfig => {
        return {
            secret: jwtSettingsConfig().jwtSecretKey,
            signOptions: jwtSettingsConfig().expiresIn,
        };
    },
});
