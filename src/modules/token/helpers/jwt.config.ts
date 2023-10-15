import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import jwtSettingsConfig from './jwt.settings.config';

export const jwtConfig = (): JwtModuleAsyncOptions => ({
    useFactory: () => {
        return {
            secret: jwtSettingsConfig().jwtSecretKey,
            signOptions: jwtSettingsConfig().expiresIn,
        };
    },
});
