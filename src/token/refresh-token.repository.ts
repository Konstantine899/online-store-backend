import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshTokenModel } from './refresh-token.model';
import { UserModel } from '../user/user.model';

@Injectable()
export class RefreshTokenRepository {
  constructor(
	@InjectModel(RefreshTokenModel)
	private readonly refreshTokenRepository: typeof RefreshTokenModel,
  ) {}

  public async createRefreshToken(
	user: UserModel,
	ttl: number,
  ): Promise<RefreshTokenModel> {
	const refresh_token = new RefreshTokenModel();
	refresh_token.user_id = user.id;
	refresh_token.is_revoked = false;
	const expires = new Date(); // Получаю текущую дату и время
	expires.setTime(expires.getTime() + ttl); // устанавливаю дату окончания действия refresh token
	refresh_token.expires = expires;
	return refresh_token.save();
  }

  public async findRefreshTokenById(
	id: number,
  ): Promise<RefreshTokenModel | null> {
	const refresh_token = await this.refreshTokenRepository.findOne({
		where: { id },
	});
	if (!refresh_token) {
		throw new NotFoundException('Refresh token не найден');
	}
	return refresh_token;
  }
}
