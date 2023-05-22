import {
  Body,
  Controller,
  Delete,
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
import { CheckLoginDocumentation } from './decorators/documentation/check-login.documentation';
import { UserModel } from '../user/user.model';
import { GetProfileUserRequest } from './requests/get-profile-user.request';
import { LogoutDocumentation } from './decorators/documentation/logout.documentation';

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
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
	return this.authService.registration(dto);
  }
  @LoginDocumentation()
  @HttpCode(200)
  @Post('/login')
  public async login(
	@Body() dto: LoginDto,
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
	return this.authService.login(dto);
  }

  @UpdateAccessTokenDocumentation()
  @HttpCode(201)
  @Post('/refresh')
  public async updateAccessToken(
	@Body() dto: RefreshDto,
  ): Promise<{ status: HttpStatus; data: IAuthPayload }> {
	return this.authService.updateAccessToken(dto.refreshToken);
  }

  @CheckLoginDocumentation()
  @UseGuards(JwtGuard)
  @Get('/login-check')
  public async loginCheck(
	@Req() request: Request,
  ): Promise<{ status: HttpStatus; data: UserModel }> {
	const { id } = request.user as GetProfileUserRequest;
	const foundUser = await this.userService.loginCheck(id);
	return {
		status: HttpStatus.OK,
		data: foundUser,
	};
  }

  @LogoutDocumentation()
  @UseGuards(JwtGuard)
  @Delete('/logout')
  public async logout(@Req() request: Request, @Body() refresh: RefreshDto) {
	return this.authService.logout(refresh, request);
  }
}
