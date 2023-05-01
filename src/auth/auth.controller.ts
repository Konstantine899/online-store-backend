import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, IAuthPayload } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserService } from '../user/user.service';
import { JwtGuard } from '../token/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationDocumentation } from './decorators/documentation/registration.documentation';
import { LoginDocumentation } from './decorators/documentation/login.documentation';
import { UpdateAccessTokenDocumentation } from './decorators/documentation/update-access-token.documentation';
import { ProfileUserDocumentation } from './decorators/documentation/profile-user.documentation';

@ApiTags(`Аутентификация`)
@Controller('auth')
export class AuthController {
  constructor(
	private readonly authService: AuthService,
	private readonly userService: UserService,
  ) {}

  @RegistrationDocumentation()
  @HttpCode(201)
  @Post('/registration')
  public async registration(
	@Body() dto: RegisterDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.registration(dto);
  }
  @LoginDocumentation()
  @HttpCode(200)
  @Post('/login')
  public async login(
	@Body() dto: LoginDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.login(dto);
  }

  @UpdateAccessTokenDocumentation()
  @HttpCode(201)
  @Post('/refresh')
  public async updateAccessToken(
	@Body() dto: RefreshDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
	return this.authService.updateAccessToken(dto.refreshToken);
  }

  @ProfileUserDocumentation()
  @UseGuards(JwtGuard)
  @Get('/profile')
  public async getProfileUser(@Req() request: Request) {
	const { id } = request.user as { id: number };
	const foundUser = await this.userService.getProfileUser(id);
	return {
		status: HttpStatus.OK,
		data: foundUser,
	};
  }
}
