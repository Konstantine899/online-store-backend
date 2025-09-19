import { IJwtSettings } from '@app/domain/jwt';

export const JwtSettings = (): IJwtSettings => ({
    jwtSecretKey: process.env.JWT_PRIVATE_KEY || 'default-secret',
    expiresIn: { expiresIn: '24h' },
});
