import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from '../user/user.model';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}
  public async generateAccessToken(user: UserModel): Promise<string> {
	const payload = { id: user.id, email: user.email, roles: user.roles };
	return this.jwtService.signAsync(payload);
  }
}
