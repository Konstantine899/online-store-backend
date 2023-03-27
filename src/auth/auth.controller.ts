import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IAuthPayload, AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request-dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { UserService } from '../user/user.service';
import { JwtGuard } from '../token/jwt.guard';
import { RoleGuard } from '../role/role.guard';
import { Roles } from './decorators/roles-auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(
	private readonly authService: AuthService,
	private readonly userService: UserService,
  ) {}

  @HttpCode(201)
  @Post('/registration')
  async registration(
	@Body() dto: RegisterRequestDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.registration(dto);
  }
  @HttpCode(200)
  @Post('/login')
  async login(
	@Body() dto: LoginRequestDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.login(dto);
  }

  @HttpCode(200)
  @Post('/refresh')
  async refresh(
	@Body() dto: RefreshRequestDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.updateAccessToken(dto.refreshToken);
  }

  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/me')
  public async getUser(@Req() request) {
	const { id } = request.user;
	const user = await this.userService.findUserById(id);
	return {
		status: 'success',
		data: user,
	};
  }
}
