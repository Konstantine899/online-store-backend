import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserModel } from '../user/user.model';
import { TokenService } from '../token/token.service';

export interface IAuthPayload {
  user: UserModel;
  payload: {
	type: string;
	accessToken: string;
	refreshToken?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
	private readonly userService: UserService,
	private readonly tokenService: TokenService,
  ) {}

  public async registration(
	dto: CreateUserDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	const candidate = await this.userService.findUserByEmail(dto.email);
	if (candidate) {
		throw new HttpException(
		`Пользователь с таким email: ${candidate} уже существует`,
		HttpStatus.BAD_REQUEST,
		);
	}
	const user = await this.userService.create(dto);
	const accessToken = await this.tokenService.generateAccessToken(user);
	const refreshToken = await this.tokenService.generateRefreshToken(
		user,
		60 * 60 * 24 * 30,
	);
	const payload = this.buildResponsePayload(user, accessToken, refreshToken);
	return {
		status: 'success',
		data: payload,
	};
  }

  async login(
	dto: CreateUserDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	const user = await this.validateUser(dto);
	const accessToken = await this.tokenService.generateAccessToken(user);
	const refreshToken = await this.tokenService.generateRefreshToken(
		user,
		60 * 60 * 24 * 30,
	);
	const payload = this.buildResponsePayload(user, accessToken, refreshToken);
	return {
		status: 'success',
		data: payload,
	};
  }

  public async updateAccessToken(
	refreshToken: string,
  ): Promise<{ status: string; data: IAuthPayload }> {
	const { user, accessToken } =
		await this.tokenService.createAccessTokenFromRefreshToken(refreshToken);
	const payload = this.buildResponsePayload(user, accessToken);
	return {
		status: 'success',
		data: payload,
	};
  }

  public buildResponsePayload(
	user: UserModel,
	accessToken: string,
	refreshToken?: string,
  ): IAuthPayload {
	return {
		user,
		payload: {
		type: 'bearer',
		accessToken,
		...(refreshToken ? { refreshToken } : {}),
		},
	};
  }

  private async validateUser(dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userService.findUserByEmail(dto.email);
	if (!user) {
		throw new UnauthorizedException({
		message: 'Не корректный email',
		});
	}
	const password = await bcrypt.compare(dto.password, user.password); // сравниваю пароли

	if (!password) {
		throw new UnauthorizedException({
		message: 'Не корректный пароль',
		});
	}
	return user;
  }
}
