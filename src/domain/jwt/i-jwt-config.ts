import { IExpiresIn } from './i-expires-in';

export interface IJwtConfig {
    secret: string;
    signOptions: IExpiresIn;
    global: boolean;
}
