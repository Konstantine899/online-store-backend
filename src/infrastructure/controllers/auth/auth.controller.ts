import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    NotFoundException,
    Post,
    Req,
    Res,
    UseGuards,
    UnauthorizedException,
    UnprocessableEntityException,
    BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, UserService } from '@app/infrastructure/services';
import { RegistrationDto, LoginDto } from '@app/infrastructure/dto';
import { ApiTags } from '@nestjs/swagger';
import {
    RegistrationSwaggerDecorator,
    LogoutSwaggerDecorator,
    LoginSwaggerDecorator,
    CheckUserAuthSwaggerDecorator,
    UpdateAccessTokenSwaggerDecorator,
} from '@app/infrastructure/common/decorators';

import {
    LoginResponse,
    RegistrationResponse,
    UpdateAccessTokenResponse,
    CheckResponse,
    LogoutResponse,
} from '@app/infrastructure/responses';

import { AuthGuard } from '@app/infrastructure/common/guards';
import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';
import { IDecodedAccessToken } from '@app/domain/jwt';
import {
    getRefreshCookieName,
    buildRefreshCookieOptions,
} from '@app/infrastructure/common/utils/cookie-options';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @RegistrationSwaggerDecorator()
    @HttpCode(201)
    @UseGuards(BruteforceGuard)
    @Post('/registration')
    public async registration(
        @Body() dto: RegistrationDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<RegistrationResponse> {
        const result = await this.authService.registration(dto);

        const cookieName = getRefreshCookieName();
        res.cookie(cookieName, result.refreshToken, buildRefreshCookieOptions());

        return {
            type: result.type,
            accessToken: result.accessToken,
        };
    }

    @LoginSwaggerDecorator()
    @HttpCode(200)
    @UseGuards(BruteforceGuard)
    @Post('/login')
    public async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponse> {
        const result = await this.authService.login(dto, req);
        // ставим refresh в HttpOnly cookie
        const cookieName = getRefreshCookieName();
        res.cookie(cookieName, result.refreshToken, buildRefreshCookieOptions());

        // Возвращаем только поля, определённые в LoginResponse, без refreshToken в теле
        return { type: result.type, accessToken: result.accessToken };
    }

    @UpdateAccessTokenSwaggerDecorator()
    @HttpCode(200)
    @UseGuards(BruteforceGuard)
    @Post('/refresh')
    public async updateAccessToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<UpdateAccessTokenResponse> {
        const cookieName = getRefreshCookieName();
        const refreshFromCookie: string | undefined =
            req.signedCookies?.[cookieName] || req.cookies?.[cookieName];

        if (!refreshFromCookie) {
            // cookie ожидается подписанной; отсутствует = невалидна/не отправлена
            throw new UnauthorizedException(
                'Отсутствует или некорректная cookie с refresh токеном',
            );
        }

        try {
            // Получаем новый access и новый refresh
            const result =
                await this.authService.updateAccessToken(refreshFromCookie);
            // Если получили новый refresh токен - обновляем cookie
            if (result.refreshToken) {
                res.cookie(cookieName, result.refreshToken, buildRefreshCookieOptions());
            }
            // Возвращаем только access токен в теле ответа
            return {
                type: result.type,
                accessToken: result.accessToken,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                // Reuse detection - очищаем cookie
                const opts = buildRefreshCookieOptions();
                res.clearCookie(cookieName, {
                    ...opts,
                    maxAge: undefined,
                    expires: new Date(0),
                });
                throw new UnauthorizedException(
                    'Refresh токен скомпрометирован. Пожалуйста, выполните вход заново.',
                );
            }

            if (error instanceof UnprocessableEntityException) {
                // Неверный формат, истёкший токен, user mismatch
                throw new UnauthorizedException('Некорректный refresh токен');
            }

            throw error;
        }
    }

    @CheckUserAuthSwaggerDecorator()
    @UseGuards(AuthGuard)
    @Get('/check')
    public async checkUserAuth(
        @Req() request: Request,
    ): Promise<CheckResponse> {
        const { id } = request.user as IDecodedAccessToken;
        if (id === undefined) {
            throw new BadRequestException('Идентификатор пользователя обязателен');
        }
        return this.userService.checkUserAuth(id);
    }

    @LogoutSwaggerDecorator()
    @UseGuards(AuthGuard)
    @HttpCode(200)
    @Delete('/logout')
    public async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LogoutResponse> {
        const cookieName = getRefreshCookieName();
        const refreshFromCookie: string | undefined =
            req.signedCookies?.[cookieName] || req.cookies?.[cookieName];

        if (!refreshFromCookie) {
            // cookie ожидается подписанной; отсутствует = невалидна/не отправлена
            throw new UnauthorizedException(
                'Отсутствует или некорректная cookie с refresh токеном',
            );
        }

        // 1) Отзываю refresh в БД (чтобы он больше нигде не сработал)
        await this.authService.logout({ refreshToken: refreshFromCookie }, req);

        // 2) Очистить cookie у клиента
        const opts = buildRefreshCookieOptions();
        res.clearCookie(cookieName, {
            ...opts,
            maxAge: undefined,
            expires: new Date(0),
        });

        return { status: 200, message: 'success' } as LogoutResponse;
    }
}
