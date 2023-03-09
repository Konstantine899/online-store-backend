import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserModel } from '../user/user.model';

@Injectable()
export class AuthService {
  constructor(
	private readonly userService: UserService,
	private readonly jwtService: JwtService,
  ) {}

  async registration(dto: CreateUserDto): Promise<string> {
	const candidate = await this.userService.findUserByEmail(dto.email);
	if (candidate) {
		throw new HttpException(
		`Пользователь с таким email: ${candidate} уже существует`,
		HttpStatus.BAD_REQUEST,
		);
	}
	const hashPassword = await bcrypt.hash(dto.password, 5);
	const user = await this.userService.create({
		...dto,
		password: hashPassword,
	});
	return this.generateToken(user);
  }

  async login(dto: CreateUserDto): Promise<string> {
	const user = await this.validateUser(dto);
	return this.generateToken(user);
  }

  private async generateToken(user: UserModel): Promise<string> {
	const payload = { id: user.id, email: user.email, roles: user.roles };
	return this.jwtService.sign(payload);
  }

  private async validateUser(dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userService.findUserByEmail(dto.email);
	if (!user) {
		throw new UnauthorizedException({
		message: 'Не корректный email или пароль',
		});
	}
	const password: string = await bcrypt.compare(dto.password, user.password); // сравниваю пароли

	if (!password) {
		throw new UnauthorizedException({
		message: 'Не корректный email или пароль',
		});
	}
	return user;
  }
}
