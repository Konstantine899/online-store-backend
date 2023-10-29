import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import jwtSettingsConfig, { IExpiresIn } from './jwt.settings.config';

interface IJwtConfig {
    secret: string;
    signOptions: IExpiresIn;
    global: boolean;
}

export const jwtConfig = (): JwtModuleAsyncOptions => ({
    useFactory: (): IJwtConfig => {
        return {
            global: true, //  Это означает, что нам не нужно импортировать JwtModule куда-либо еще в нашем приложении.
            secret: jwtSettingsConfig().jwtSecretKey,
            signOptions: jwtSettingsConfig().expiresIn,
        };
    },
});
