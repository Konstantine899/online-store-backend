import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CheckResponse } from '../auth/responses/check-response';
import jwtSettingsConfig from './helpers/jwt.settings.config';

interface IAccessTokenSubject {
    sub: number; // сокращение от subject
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSettingsConfig().jwtSecretKey,
            signOptions: jwtSettingsConfig().expiresIn,
        });
    }

    public async validate(
        payload: IAccessTokenSubject,
    ): Promise<CheckResponse> {
        const user = await this.userService.checkUserAuth(payload.sub);
        if (!user) {
            return null;
        }
        return user;
    }
}
