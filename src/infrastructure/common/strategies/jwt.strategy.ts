import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { CheckResponse } from '../../responses/auth/check-response';
import jwtSettingsConfig from '../../config/jwt/jwt.settings.config';
import { IAccessTokenSubject } from '../../../domain/jwt/i-access-token-subject';

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
