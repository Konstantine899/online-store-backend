import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import appConfig from './app.config';

export const jwtConfig: JwtModuleAsyncOptions = {
    useFactory: () => {
        return {
            secret: appConfig().jwtSecretKey,
            signOptions: { expiresIn: '24h' }, // время жизни токена
        };
    },
};
