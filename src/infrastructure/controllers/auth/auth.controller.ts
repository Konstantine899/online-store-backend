import {
    CheckUserAuthSwaggerDecorator,
    LoginSwaggerDecorator,
    LogoutSwaggerDecorator,
    RegistrationSwaggerDecorator,
    UpdateAccessTokenSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { LoginDto, RegistrationDto } from '@app/infrastructure/dto';
import { ForgotPasswordDto } from '@app/infrastructure/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from '@app/infrastructure/dto/auth/reset-password.dto';
import { AuthService, UserService } from '@app/infrastructure/services';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    NotFoundException,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UnprocessableEntityException,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
    CheckResponse,
    LoginResponse,
    LogoutResponse,
    RegistrationResponse,
    UpdateAccessTokenResponse,
} from '@app/infrastructure/responses';

import { IDecodedAccessToken } from '@app/domain/jwt';
import { AuthGuard } from '@app/infrastructure/common/guards';
import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';
import {
    buildRefreshCookieOptions,
    getRefreshCookieName,
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
        res.cookie(
            cookieName,
            result.refreshToken,
            buildRefreshCookieOptions(),
        );

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
        res.cookie(
            cookieName,
            result.refreshToken,
            buildRefreshCookieOptions(),
        );

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
            req.signedCookies?.[cookieName] ?? req.cookies?.[cookieName];

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
                res.cookie(
                    cookieName,
                    result.refreshToken,
                    buildRefreshCookieOptions(),
                );
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
            throw new BadRequestException(
                'Идентификатор пользователя обязателен',
            );
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
            req.signedCookies?.[cookieName] ?? req.cookies?.[cookieName];

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

    // ============================================================
    // PASSWORD RESET ENDPOINTS
    // ============================================================

    @ApiOperation({
        summary: 'Запрос сброса пароля',
        description:
            'Генерирует токен сброса пароля и отправляет ссылку на email (mock для MVP)',
    })
    @ApiResponse({
        status: 200,
        description:
            'Инструкции отправлены (всегда возвращается success для security)',
        schema: {
            properties: {
                message: {
                    type: 'string',
                    example: 'Инструкции по сбросу пароля отправлены на email',
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Некорректный формат email',
    })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (3 попытки/час)',
    })
    @HttpCode(200)
    @UseGuards(BruteforceGuard)
    @Post('/forgot-password')
    async forgotPassword(
        @Body() dto: ForgotPasswordDto,
        @Req() req: Request,
    ): Promise<{ message: string }> {
        const tenantId = undefined; // TODO: получить из TenantMiddleware когда будет реализовано
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        await this.authService.forgotPassword(
            dto.email,
            tenantId,
            ipAddress,
            userAgent,
        );

        // Всегда возвращаем success (security: не раскрываем есть ли email)
        return {
            message: 'Инструкции по сбросу пароля отправлены на email',
        };
    }

    @ApiOperation({
        summary: 'Сброс пароля по токену',
        description:
            'Сбрасывает пароль пользователя и завершает все активные сессии',
    })
    @ApiResponse({
        status: 200,
        description: 'Пароль успешно изменён',
        schema: {
            properties: {
                message: {
                    type: 'string',
                    example: 'Пароль успешно изменён',
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Некорректный формат токена или слабый пароль',
    })
    @ApiResponse({
        status: 401,
        description: 'Токен некорректен, истёк или уже использован',
    })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (5 попыток/час)',
    })
    @HttpCode(200)
    @UseGuards(BruteforceGuard)
    @Post('/reset-password')
    async resetPassword(
        @Body() dto: ResetPasswordDto,
    ): Promise<{ message: string }> {
        const tenantId = undefined; // TODO: получить из TenantMiddleware

        await this.authService.resetPassword(
            dto.token,
            dto.newPassword,
            tenantId,
        );

        return {
            message: 'Пароль успешно изменён',
        };
    }
}
