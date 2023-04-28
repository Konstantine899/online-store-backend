import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserModel } from '../user/user.model';
import appConfig from '../config/app.config';

export interface IAccessTokenSubject {
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

  public async validate(payload: IAccessTokenSubject): Promise<UserModel> {
	const user = await this.userService.getUser(payload.sub);
	if (!user) {
		return null;
	}
	return user;
  }
}
