import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../services/auth/auth.service';
import { RegistrationDto } from '../../dto/auth/registration.dto';
import { LoginDto } from '../../dto/auth/login.dto';
import { RefreshDto } from '../../dto/auth/refresh.dto';
import { UserService } from '../../services/user/user.service';
import { ApiTags } from '@nestjs/swagger';
import {
    RegistrationSwaggerDecorator,
    LogoutSwaggerDecorator,
    LoginSwaggerDecorator,
    CheckUserAuthSwaggerDecorator,
    UpdateAccessTokenSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/auth';

import { LoginResponse } from '../../responses/auth/login.response';
import { RegistrationResponse } from '../../responses/auth/registration.response';
import { UpdateAccessTokenResponse } from '../../responses/auth/update-access-token.response';
import { CheckResponse } from '../../responses/auth/check-response';
import { LogoutResponse } from '../../responses/auth/logout.response';

import { AuthGuard } from '../../common/guards/auth.guard';
import { IAuthController } from '@app/domain/controllers';
import { UserModel } from '@app/domain/models/user.model';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController implements IAuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @RegistrationSwaggerDecorator()
    @HttpCode(201)
    @Post('/registration')
    public async registration(
        @Body() dto: RegistrationDto,
    ): Promise<RegistrationResponse> {
        return this.authService.registration(dto);
    }

    @LoginSwaggerDecorator()
    @HttpCode(200)
    @Post('/login')
    public async login(@Body() dto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(dto);
    }

    @UpdateAccessTokenSwaggerDecorator()
    @HttpCode(201)
    @Post('/refresh')
    public async updateAccessToken(
        @Body() dto: RefreshDto,
    ): Promise<UpdateAccessTokenResponse> {
        return this.authService.updateAccessToken(dto.refreshToken);
    }

    @CheckUserAuthSwaggerDecorator()
    @UseGuards(AuthGuard)
    @Get('/check')
    public async checkUserAuth(
        @Req() request: Request,
    ): Promise<CheckResponse> {
        const { id } = request.user as UserModel;
        return this.userService.checkUserAuth(id);
    }

    @LogoutSwaggerDecorator()
    @UseGuards(AuthGuard)
    @Delete('/logout')
    public async logout(
        @Req() request: Request,
        @Body() refresh: RefreshDto,
    ): Promise<LogoutResponse> {
        return this.authService.logout(refresh, request);
    }
}
