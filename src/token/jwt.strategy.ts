import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserModel } from '../user/user.model';
import appConfig from '../config/app.config';

export interface IAccessTokenPayload {
  sub: number; // сокращение от subject
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
	super({
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		ignoreExpiration: false,
		secretOrKey: appConfig().jwtSecretKey,
		signOptions: { expiresIn: '24h' },
	});
  }

  async validate(payload: IAccessTokenPayload): Promise<UserModel> {
	const user = await this.userService.findUserById(payload.sub);
	if (!user) {
		return null;
	}
	return user;
  }
}
