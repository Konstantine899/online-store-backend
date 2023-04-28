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
import { RoleGuard } from '../role/role.guard';
import { Roles } from './decorators/roles-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationDocumentation } from './decorators/documentation/registration.documentation';

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
  @HttpCode(200)
  @Post('/login')
  public async login(
    @Body() dto: LoginDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
    return this.authService.login(dto);
  }

  @HttpCode(200)
  @UseGuards(JwtGuard)
  @Post('/refresh')
  public async refresh(
    @Body() dto: RefreshDto,
  ): Promise<{ status: string; data: IAuthPayload }> {
    return this.authService.updateAccessToken(dto.refreshToken);
  }

  @Roles('ADMIN')
  @UseGuards(JwtGuard)
  @UseGuards(RoleGuard)
  @Get('/me')
  public async getUser(@Req() request) {
    const { id } = request.user;
    const user = await this.userService.getUser(id);
    return {
      status: 'success',
      data: user,
    };
  }
}
