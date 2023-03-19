import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IAuthPayload, AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request-dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
