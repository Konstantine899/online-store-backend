import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserModel } from '../user/user.model';
import { TokenService } from '../token/token.service';
import { RefreshDto } from './dto/refresh.dto';
import { Request } from 'express';
import { LogoutResponse } from './responses/logout.response';
import { IPayload } from './interfaces/i-payload';
import { LoginResponse } from './responses/login.response';

@Injectable()
export class AuthService {
  constructor(
	private readonly userService: UserService,
	private readonly tokenService: TokenService,
  ) {}

  public async registration(
	dto: CreateUserDto,
  ): Promise<{ status: HttpStatus; data: IPayload }> {
	const candidate = await this.userService.findUserByEmail(dto.email);
	if (candidate) {
		this.badRequest(
		`Пользователь с таким email: ${candidate.email} уже существует`,
		);
	}
	const user = await this.userService.createUser(dto);
	const accessToken = await this.tokenService.generateAccessToken(user);
	const refreshToken = await this.tokenService.generateRefreshToken(
		user,
		60 * 60 * 24 * 30,
	);
	const payload = this.buildResponsePayload(user, accessToken, refreshToken);
	return {
		status: HttpStatus.OK,
		data: payload,
	};
  }

  public async login(dto: CreateUserDto): Promise<LoginResponse> {
	const user = await this.validateUser(dto);
	const accessToken = await this.tokenService.generateAccessToken(user);
	const refreshToken = await this.tokenService.generateRefreshToken(
		user,
		60 * 60 * 24 * 30,
	);
	const payload = this.buildResponsePayload(user, accessToken, refreshToken);
	return {
		status: HttpStatus.OK,
		data: payload,
	};
  }

  public async logout(
	refresh: RefreshDto,
	request: Request,
  ): Promise<LogoutResponse> {
	const payload = await this.tokenService.decodeRefreshToken(
		refresh.refreshToken,
	);
	await this.tokenService.removeRefreshToken(payload.jti, payload.sub);
	request.headers.authorization = null; // обнуляю access token
	return { status: HttpStatus.OK, message: `success` };
  }

  public async updateAccessToken(
	refreshToken: string,
  ): Promise<{ status: HttpStatus; data: IPayload }> {
	const { user, accessToken } =
		await this.tokenService.createAccessTokenFromRefreshToken(refreshToken);
	const payload = this.buildResponsePayload(user, accessToken);
	return {
		status: HttpStatus.OK,
		data: payload,
	};
  }

  public buildResponsePayload(
	user: UserModel,
	accessToken: string,
	refreshToken?: string,
  ): IPayload {
	return {
		payload: {
		type: 'Bearer',
		accessToken,
		...(refreshToken ? { refreshToken } : {}),
		},
	};
  }

  private async validateUser(dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userService.findUserByEmail(dto.email);
	if (!user) {
		this.unauthorized('Не корректный email');
	}
	const password = await bcrypt.compare(dto.password, user.password); // сравниваю пароли
	if (!password) {
		this.unauthorized('Не корректный пароль');
	}
	return this.userService.findAuthenticatedUser(user.id);
  }

  private unauthorized(message): void {
	throw new UnauthorizedException({
		status: HttpStatus.UNAUTHORIZED,
		message,
	});
  }

  private badRequest(message: string): void {
	throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message });
  }
}
