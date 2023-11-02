import { IJwtSettings } from '../../../domain/jwt/i-jwt-settings';

export const JwtSettings = (): IJwtSettings => ({
    jwtSecretKey: process.env.JWT_PRIVATE_KEY,
    expiresIn: { expiresIn: '24h' },
});
