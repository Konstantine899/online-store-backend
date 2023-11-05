import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '@app/infrastructure/services';
import { CheckResponse } from '@app/infrastructure/responses';
import { JwtSettings } from '@app/infrastructure/config/jwt';
import { IAccessTokenSubject } from '@app/domain/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JwtSettings().jwtSecretKey,
            signOptions: JwtSettings().expiresIn,
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
