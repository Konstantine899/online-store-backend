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

export interface IAuthPayload {
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
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
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

  public async login(
	dto: CreateUserDto,
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
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

  public async updateAccessToken(
	refreshToken: string,
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
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
  ): IAuthPayload {
	return {
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
