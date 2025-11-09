import {
    AddRoleDto,
    CreateUserDto,
    RemoveRoleDto,
    UpdateConsentsDto,
    UpdateDateOfBirthDto,
    UpdateUserProfileDto,
    UpdateUserStatusDto,
} from '@app/infrastructure/dto';
import { UpdateUserDto } from '@app/infrastructure/dto/user/update-user.dto';
import { UserService } from '@app/infrastructure/services';
import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import {
    AddRoleUserSwaggerDecorator,
    CreateUserSwaggerDecorator,
    GetListUsersSwaggerDecorator,
    GetUserSwaggerDecorator,
    RemoveRoleUserSwaggerDecorator,
    RemoveUserSwaggerDecorator,
    Roles,
    UpdateUserPhoneSwaggerDecorator,
    UpdateUserSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { ChangePasswordSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/change-password.swagger';
import { UpdateConsentsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-consents.swagger';
import { UpdateDateOfBirthSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-date-of-birth.swagger';

import {
    AuthGuard,
    BruteforceGuard,
    RoleGuard,
} from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';

import { UpdateUserFlagsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-flags.swagger';
import { UpdateUserPreferencesSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-preferences.swagger';
import { UpdateUserProfileSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-profile.swagger';
import { UpdateUserStatusSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-status.swagger';
import { GetUserStatsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/user-stats.swagger';
import {
    ConfirmEmailCodeSwaggerDecorator,
    ConfirmPhoneCodeSwaggerDecorator,
    RequestEmailCodeSwaggerDecorator,
    RequestPhoneCodeSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/user/verification.swagger';
import {
    VerifyUserEmailSwaggerDecorator,
    VerifyUserPhoneSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/user/verify-user.swagger';
import { UpdateUserPhoneDto } from '@app/infrastructure/dto';
import { ChangePasswordDto } from '@app/infrastructure/dto/user/change-password.dto';
import { ConfirmVerificationDto } from '@app/infrastructure/dto/user/confirm-verification.dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import {
    AddRoleResponse,
    ConfirmVerificationCodeResponse,
    CreateUserResponse,
    GetPaginatedUsersResponse,
    GetUserResponse,
    RemoveUserResponse,
    RemoveUserRoleResponse,
    RequestVerificationCodeResponse,
    UpdateConsentsResponse,
    UpdateDateOfBirthResponse,
    UpdateUserPhoneResponse,
    UpdateUserResponse,
    UpdateUserStatusResponse,
} from '@app/infrastructure/responses';

import { IUserController } from '@app/domain/controllers';
import { VERIFICATION_CODE_EXPIRY_MS } from '@app/infrastructure/config/verification.config';

// Оптимизированные типы для Request
interface AuthenticatedRequest extends Request {
    user: { id: number; tenantId: number; roles: { role: string }[] };
}

// Оптимизированные константы ролей
const USER_ROLES = [
    'VIP_CUSTOMER',
    'WHOLESALE',
    'CUSTOMER',
    'AFFILIATE',
    'GUEST',
    'USER',
    'ADMIN',
] as const;
const ADMIN_ROLES = [
    'SUPER_ADMIN',
    'PLATFORM_ADMIN',
    'TENANT_OWNER',
    'TENANT_ADMIN',
    'ADMIN',
] as const;
const STAFF_ROLES = [
    'TENANT_OWNER',
    'TENANT_ADMIN',
    'MANAGER',
    'CONTENT_MANAGER',
    'CUSTOMER_SERVICE',
    'ADMIN',
] as const;

// Глобальный экземпляр валидатора для оптимизации производительности
const validationPipe = new CustomValidationPipe();

// Композитные декораторы для оптимизации производительности
const AdminGuards = (): ReturnType<typeof UseGuards> =>
    UseGuards(AuthGuard, RoleGuard);
const UserGuards = (): ReturnType<typeof UseGuards> =>
    UseGuards(AuthGuard, RoleGuard);
const StaffGuards = (): ReturnType<typeof UseGuards> =>
    UseGuards(AuthGuard, RoleGuard);

@ApiTags('Пользователи')
@Controller('user')
export class UserController implements IUserController {
    constructor(private readonly userService: UserService) {}

    // Метод для извлечения userId с валидацией
    private extractUserId(req: AuthenticatedRequest): number {
        return req.user.id;
    }

    // Метод для извлечения tenantId с валидацией
    private extractTenantId(req: AuthenticatedRequest): number {
        const tenantId = (req.user as { tenantId?: number }).tenantId;
        if (!tenantId) {
            throw new UnauthorizedException(
                'Tenant ID не найден в токене авторизации',
            );
        }
        return tenantId;
    }

    // Метод для создания ответа
    private createResponse<T>(data: T): { data: T } {
        return { data };
    }

    @CreateUserSwaggerDecorator()
    @HttpCode(201)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('/create')
    public async createUser(
        @Body() dto: CreateUserDto,
    ): Promise<CreateUserResponse> {
        return this.userService.createUser(dto);
    }

    @GetListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles(...STAFF_ROLES)
    @StaffGuards()
    @Get('/get-list-users')
    public async getListUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userService.getListUsers(page, limit);
    }

    @UpdateUserSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Put('/update/:id')
    public async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        return this.userService.updateUser(id, dto);
    }

    @RemoveUserSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Delete('/delete/:id')
    public async removeUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveUserResponse> {
        return this.userService.removeUser(id);
    }

    @AddRoleUserSwaggerDecorator()
    @HttpCode(201)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('/role/add')
    public async addRole(@Body() dto: AddRoleDto): Promise<AddRoleResponse> {
        return this.userService.addRole(dto);
    }

    @RemoveRoleUserSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Delete('/role/delete')
    public async removeRole(
        @Body() dto: RemoveRoleDto,
    ): Promise<RemoveUserRoleResponse> {
        return this.userService.removeUserRole(dto);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @Roles(...USER_ROLES)
    @UserGuards()
    public async getMe(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ id: number }> {
        const userId = this.extractUserId(req);
        try {
            return await this.userService.findAuthenticatedUser(userId);
        } catch {
            // Возвращаем минимальный профиль, чтобы не падать 4xx в несущественных сценариях
            return { id: userId };
        }
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateUserPhoneSwaggerDecorator()
    @Patch('profile/phone')
    @HttpCode(HttpStatus.OK)
    async updatePhone(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateUserPhoneDto,
    ): Promise<{ data: UpdateUserPhoneResponse }> {
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePhone(userId, dto.phone);
        const ensuredPhone = user.phone ?? '';
        return this.createResponse({ id: user.id, phone: ensuredPhone });
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateDateOfBirthSwaggerDecorator()
    @Patch('profile/date-of-birth')
    @HttpCode(HttpStatus.OK)
    async updateDateOfBirth(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateDateOfBirthDto,
    ): Promise<{ data: UpdateDateOfBirthResponse }> {
        const userId = this.extractUserId(req);
        const user = await this.userService.updateDateOfBirth(
            userId,
            dto.dateOfBirth,
        );
        // Sequelize DATEONLY может возвращать как строку 'YYYY-MM-DD', так и Date объект
        const ensuredDateOfBirth = user.dateOfBirth
            ? typeof user.dateOfBirth === 'string'
                ? user.dateOfBirth
                : user.dateOfBirth.toISOString().split('T')[0]
            : null;
        return this.createResponse({
            id: user.id,
            dateOfBirth: ensuredDateOfBirth,
        });
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateConsentsSwaggerDecorator()
    @Patch('consents')
    @HttpCode(HttpStatus.OK)
    async updateConsents(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateConsentsDto,
    ): Promise<{ data: UpdateConsentsResponse }> {
        const userId = this.extractUserId(req);
        const user = await this.userService.updateConsents(userId, dto);
        return this.createResponse({
            id: user.id,
            isNewsletterSubscribed: user.isNewsletterSubscribed ?? false,
            isMarketingConsent: user.isMarketingConsent ?? false,
            isCookieConsent: user.isCookieConsent ?? false,
        });
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateUserProfileSwaggerDecorator()
    @Patch('profile')
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const userId = this.extractUserId(req);
        return this.userService.updateProfile(userId, dto);
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @ChangePasswordSwaggerDecorator()
    @Patch('profile/password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: ChangePasswordDto,
    ): Promise<{ status: number; message: string }> {
        const userId = this.extractUserId(req);
        await this.userService.changePassword(
            userId,
            dto.oldPassword,
            dto.newPassword,
        );
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateUserFlagsSwaggerDecorator()
    @Patch('profile/flags')
    @HttpCode(HttpStatus.OK)
    async updateFlags(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateUserFlagsDto,
    ): Promise<{ data: unknown }> {
        console.log('updateFlags method called');
        const userId = this.extractUserId(req);
        const user = await this.userService.updateFlags(userId, dto);
        console.log('updateFlags returning:', user);
        return this.createResponse(user.toJSON());
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @UpdateUserPreferencesSwaggerDecorator()
    @Patch('profile/preferences')
    @HttpCode(HttpStatus.OK)
    async updatePreferences(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: UpdateUserPreferencesDto,
    ): Promise<{ data: unknown }> {
        console.log('updatePreferences method called');
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePreferences(userId, dto);
        console.log('updatePreferences returning:', user);
        return this.createResponse(user.get({ plain: true }));
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @VerifyUserEmailSwaggerDecorator()
    @Patch('verify/email/:id')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const adminTenantId = req.user.tenantId;
        const user = await this.userService.verifyEmailFlag(id, adminTenantId);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @VerifyUserPhoneSwaggerDecorator()
    @Patch('verify/phone/:id')
    @HttpCode(HttpStatus.OK)
    async verifyPhone(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const adminTenantId = req.user.tenantId;
        const user = await this.userService.verifyPhoneFlag(id, adminTenantId);
        return this.createResponse(user);
    }

    /**
     * Запрашивает код подтверждения email для текущего пользователя.
     *
     * Отправляет 6-значный hex код на email пользователя с временем жизни 10 минут.
     * Защищён rate limiting (3 запроса за 5 минут) и cooldown (60 сек между запросами).
     *
     * @param {AuthenticatedRequest} req - HTTP запрос с JWT payload (userId, tenantId)
     * @returns {Promise<RequestVerificationCodeResponse>} Сообщение об успешной отправке и время истечения кода
     *
     * @throws {UnauthorizedException} Токен JWT недействителен или отсутствует
     * @throws {NotFoundException} Пользователь не найден или не принадлежит tenant
     * @throws {BadRequestException} Cooldown период не истёк (< 60 сек с последнего запроса)
     * @throws {TooManyRequestsException} Превышен rate limit (> 3 запросов за 5 минут)
     *
     * @endpoint POST /users/verify/email/request
     * @auth JWT (USER роли)
     */
    @RequestEmailCodeSwaggerDecorator()
    @Roles(...USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard, BruteforceGuard)
    @Throttle({ 'verification-request': { limit: 3, ttl: 300000 } })
    @Post('verify/email/request')
    @HttpCode(HttpStatus.OK)
    async requestEmailCode(
        @Req() req: AuthenticatedRequest,
    ): Promise<RequestVerificationCodeResponse> {
        const userId = this.extractUserId(req);
        const tenantId = this.extractTenantId(req);

        await this.userService.requestVerificationCode(
            userId,
            'email',
            tenantId,
        );

        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);
        return {
            message: 'Код подтверждения отправлен на ваш email',
            expiresAt: expiresAt.toISOString(),
        };
    }

    /**
     * Подтверждает email пользователя по введённому коду.
     *
     * Проверяет корректность кода, срок действия (10 мин) и количество попыток (макс. 5).
     * При успехе обновляет is_email_verified=true и email_verified_at.
     * Защищён rate limiting (5 попыток за 5 минут).
     *
     * @param {AuthenticatedRequest} req - HTTP запрос с JWT payload
     * @param {ConfirmVerificationDto} dto - Объект с кодом подтверждения (6 hex символов)
     * @returns {Promise<ConfirmVerificationCodeResponse>} Результат верификации (success message, verified flag)
     *
     * @throws {BadRequestException} Код неверный, истёк или превышены попытки (5 max)
     * @throws {TooManyRequestsException} Превышен rate limit (> 5 попыток за 5 минут)
     *
     * @endpoint POST /users/verify/email/confirm
     * @auth JWT (USER роли)
     */
    @ConfirmEmailCodeSwaggerDecorator()
    @Roles(...USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard, BruteforceGuard)
    @Throttle({ 'verification-confirm': { limit: 5, ttl: 300000 } })
    @Post('verify/email/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmEmailCode(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: ConfirmVerificationDto,
    ): Promise<ConfirmVerificationCodeResponse> {
        const userId = this.extractUserId(req);
        const tenantId = this.extractTenantId(req);

        await this.userService.confirmVerificationCode(
            userId,
            'email',
            dto.code,
            tenantId,
        );

        return {
            message: 'Email успешно подтверждён',
            verified: true,
        };
    }

    /**
     * Запрашивает код подтверждения телефона для текущего пользователя.
     *
     * Отправляет 6-значный hex код на телефон пользователя через SMS с временем жизни 10 минут.
     * Защищён rate limiting (3 запроса за 5 минут) и cooldown (60 сек между запросами).
     *
     * @param {AuthenticatedRequest} req - HTTP запрос с JWT payload (userId, tenantId)
     * @returns {Promise<RequestVerificationCodeResponse>} Сообщение об успешной отправке и время истечения кода
     *
     * @throws {UnauthorizedException} Токен JWT недействителен или отсутствует
     * @throws {NotFoundException} Пользователь не найден или не принадлежит tenant
     * @throws {BadRequestException} Cooldown период не истёк (< 60 сек) или номер телефона не указан
     * @throws {TooManyRequestsException} Превышен rate limit (> 3 запросов за 5 минут)
     *
     * @endpoint POST /users/verify/phone/request
     * @auth JWT (USER роли)
     */
    @RequestPhoneCodeSwaggerDecorator()
    @Roles(...USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard, BruteforceGuard)
    @Throttle({ 'verification-request': { limit: 3, ttl: 300000 } })
    @Post('verify/phone/request')
    @HttpCode(HttpStatus.OK)
    async requestPhoneCode(
        @Req() req: AuthenticatedRequest,
    ): Promise<RequestVerificationCodeResponse> {
        const userId = this.extractUserId(req);
        const tenantId = this.extractTenantId(req);

        await this.userService.requestVerificationCode(
            userId,
            'phone',
            tenantId,
        );

        const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS);
        return {
            message: 'Код подтверждения отправлен на ваш телефон',
            expiresAt: expiresAt.toISOString(),
        };
    }

    /**
     * Подтверждает телефон пользователя по введённому коду.
     *
     * Проверяет корректность кода, срок действия (10 мин) и количество попыток (макс. 5).
     * При успехе обновляет is_phone_verified=true и phone_verified_at.
     * Защищён rate limiting (5 попыток за 5 минут).
     *
     * @param {AuthenticatedRequest} req - HTTP запрос с JWT payload
     * @param {ConfirmVerificationDto} dto - Объект с кодом подтверждения (6 hex символов)
     * @returns {Promise<ConfirmVerificationCodeResponse>} Результат верификации (success message, verified flag)
     *
     * @throws {BadRequestException} Код неверный, истёк или превышены попытки (5 max)
     * @throws {TooManyRequestsException} Превышен rate limit (> 5 попыток за 5 минут)
     *
     * @endpoint POST /users/verify/phone/confirm
     * @auth JWT (USER роли)
     */
    @ConfirmPhoneCodeSwaggerDecorator()
    @Roles(...USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard, BruteforceGuard)
    @Throttle({ 'verification-confirm': { limit: 5, ttl: 300000 } })
    @Post('verify/phone/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmPhoneCode(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: ConfirmVerificationDto,
    ): Promise<ConfirmVerificationCodeResponse> {
        const userId = this.extractUserId(req);
        const tenantId = this.extractTenantId(req);

        await this.userService.confirmVerificationCode(
            userId,
            'phone',
            dto.code,
            tenantId,
        );

        return {
            message: 'Телефон успешно подтверждён',
            verified: true,
        };
    }

    // ADMIN actions: block/unblock, suspend/unsuspend, delete/restore, premium upgrade/downgrade, employee on/off
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/block/:id')
    @HttpCode(HttpStatus.OK)
    async block(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.blockUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/unblock/:id')
    @HttpCode(HttpStatus.OK)
    async unblock(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.unblockUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/suspend/:id')
    @HttpCode(HttpStatus.OK)
    async suspend(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.suspendUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/unsuspend/:id')
    @HttpCode(HttpStatus.OK)
    async unsuspend(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.unsuspendUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/delete/:id')
    @HttpCode(HttpStatus.OK)
    async softDelete(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.softDeleteUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/restore/:id')
    @HttpCode(HttpStatus.OK)
    async restore(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: unknown }> {
        const user = await this.userService.restoreUser(id);
        return this.createResponse(user);
    }

    // ===== Admin Statistics Endpoint =====
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @GetUserStatsSwaggerDecorator()
    @Get('admin/stats')
    @HttpCode(HttpStatus.OK)
    async getUserStats(): Promise<{ data: unknown }> {
        const stats = await this.userService.getUserStats();
        return this.createResponse(stats);
    }

    // ===== Admin User Status Management =====
    /**
     * Обновляет статусные флаги пользователя (VIP, Premium, Beta Tester)
     * Доступно только администраторам (SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN)
     * С TENANT ISOLATION: администратор может изменять только пользователей своего тенанта
     */
    @UpdateUserStatusSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    async updateUserStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body(validationPipe) dto: UpdateUserStatusDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<UpdateUserStatusResponse> {
        // Извлекаем tenantId из JWT токена
        const currentUser = req.user as { tenantId?: number };
        const tenantId = currentUser.tenantId;

        if (!tenantId) {
            throw new UnauthorizedException(
                'Tenant ID не найден в токене авторизации',
            );
        }

        const updatedUser = await this.userService.updateUserStatus(
            id,
            dto,
            tenantId,
        );
        // TODO: Поля isVipCustomer/isPremium/isBetaTester удалены из модели
        // Метод требует рефакторинга для работы с новой моделью ролей/подписок
        return {
            id: updatedUser.id,
        };
    }

    // ===== Get User by ID (moved to end to avoid route conflicts) =====
    @GetUserSwaggerDecorator()
    @HttpCode(200)
    @Roles(...STAFF_ROLES)
    @StaffGuards()
    @Get('/:id')
    public async getUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetUserResponse> {
        return this.userService.getUser(id);
    }
}
