import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(JwtGuard)
  @Get('/user/profile')
  public async getProfileUser(@Req() request) {
	const { id } = request.user;
	const user = await this.userService.getProfileUser(id);
	return {
		status: 'success',
		data: user,
	};
  }
}
