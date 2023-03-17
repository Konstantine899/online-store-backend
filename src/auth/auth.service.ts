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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
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
    return this.tokenService.generateAccessToken(user);
  }

  async login(dto: CreateUserDto): Promise<string> {
    const user = await this.validateUser(dto);
    return this.tokenService.generateAccessToken(user);
  }

  private async validateUser(dto: CreateUserDto): Promise<UserModel> {
    const user = await this.userService.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Не корректный email или пароль',
      });
    }
    const password = await bcrypt.compare(dto.password, user.password); // сравниваю пароли

    if (!password) {
      throw new UnauthorizedException({
        message: 'Не корректный email или пароль',
      });
    }
    return user;
  }
}
