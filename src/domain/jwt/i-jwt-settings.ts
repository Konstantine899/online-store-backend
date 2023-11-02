import { IExpiresIn } from './i-expires-in';

export interface IJwtSettings {
    jwtSecretKey: string;
    expiresIn: IExpiresIn;
}
