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
import { AuthService } from './auth.service';
import { RegistrationDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserService } from '../user/user.service';
import { JwtGuard } from '../token/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationDocumentation } from './decorators/documentation/registration-documentation';
import { LoginDocumentation } from './decorators/documentation/login.documentation';
import { UpdateAccessTokenDocumentation } from './decorators/documentation/update-access-token.documentation';
import { LoginCheckDocumentation } from './decorators/documentation/login-check.documentation';
import { UserModel } from '../user/user.model';
import { LoginCheckRequest } from './requests/login-check.request';
import { LogoutDocumentation } from './decorators/documentation/logout.documentation';
import { LoginResponse } from './responses/login.response';
import { RegistrationResponse } from './responses/registration.response';
import { UpdateAccessTokenResponse } from './responses/update-access-token.response';

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
	@Body() dto: RegistrationDto,
  ): Promise<RegistrationResponse> {
	return this.authService.registration(dto);
  }
  @LoginDocumentation()
  @HttpCode(200)
  @Post('/login')
  public async login(@Body() dto: LoginDto): Promise<LoginResponse> {
	return this.authService.login(dto);
  }

  @UpdateAccessTokenDocumentation()
  @HttpCode(201)
  @Post('/refresh')
  public async updateAccessToken(
	@Body() dto: RefreshDto,
  ): Promise<UpdateAccessTokenResponse> {
	return this.authService.updateAccessToken(dto.refreshToken);
  }

  @LoginCheckDocumentation()
  @UseGuards(JwtGuard)
  @Get('/login-check')
  public async loginCheck(
	@Req() request: Request,
  ): Promise<{ status: HttpStatus; data: UserModel }> {
	const { id } = request.user as LoginCheckRequest;
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
