import { IJwtSettings } from '@app/domain/jwt';
import { getConfig } from '@app/infrastructure/config';

// Ленивая инициализация чтобы не требовать env до первого вызова
let SETTINGS: IJwtSettings | undefined;

export const JwtSettings = (): IJwtSettings => {
    if (!SETTINGS) {
        const cfg = getConfig();
        SETTINGS = Object.freeze({
            jwtSecretKey: cfg.JWT_ACCESS_SECRET,
            expiresIn: { expiresIn: cfg.JWT_ACCESS_TTL },
        });
    }
    return SETTINGS;
};
