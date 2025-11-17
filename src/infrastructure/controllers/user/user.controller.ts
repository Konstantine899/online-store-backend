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
import {
    BulkActivateUsersSwaggerDecorator,
    BulkBlockUsersSwaggerDecorator,
    BulkDeactivateUsersSwaggerDecorator,
    BulkDeleteUsersSwaggerDecorator,
    BulkUnblockUsersSwaggerDecorator,
    BulkVerifyUsersSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/user/bulk-operations.swagger';
import { ChangePasswordSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/change-password.swagger';
import { UpdateConsentsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-consents.swagger';
import { UpdateDateOfBirthSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-date-of-birth.swagger';

import {
    AuthGuard,
    BruteforceGuard,
    RoleGuard,
} from '@app/infrastructure/common/guards';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { UserModel } from '@app/domain/models';
import { UpdateUserFlagsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-flags.swagger';
import { UpdateUserPreferencesSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-preferences.swagger';
import { UpdateUserProfileSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-profile.swagger';
import { UpdateUserStatusSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-status.swagger';
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
import { BulkUsersDto } from '@app/infrastructure/dto/user/bulk-users.dto';
import { ChangePasswordDto } from '@app/infrastructure/dto/user/change-password.dto';
import { ConfirmVerificationDto } from '@app/infrastructure/dto/user/confirm-verification.dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import {
    AddRoleResponse,
    BulkOperationResponse,
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
    UpdateUserPreferencesResponse,
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

    /**
     * Универсальный endpoint для фильтрации пользователей
     * GET /user/list?filterType=active&page=1&limit=5
     * Доступен только для администраторов
     */
    @ApiOperation({
        summary: 'Получить список пользователей с фильтрацией',
        description:
            'Универсальный endpoint для получения списка пользователей с различными фильтрами (активные, заблокированные, верифицированные и т.д.)',
    })
    @ApiQuery({
        name: 'filterType',
        required: false,
        description:
            'Тип фильтра (active, blocked, verified, unverified, newsletter). Если не указан - возвращаются все пользователи',
        enum: ['active', 'blocked', 'verified', 'unverified', 'newsletter'],
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Номер страницы (по умолчанию: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description:
            'Количество записей на странице (по умолчанию: 5, максимум: 100)',
        example: 5,
    })
    @ApiResponse({
        status: 200,
        description: 'Список пользователей успешно получен',
        type: GetPaginatedUsersResponse,
    })
    @ApiResponse({
        status: 400,
        description:
            'Некорректные параметры запроса (неизвестный тип фильтра, неверный page/limit)',
    })
    @ApiResponse({
        status: 401,
        description: 'Пользователь не аутентифицирован',
    })
    @ApiResponse({
        status: 403,
        description: 'Доступ запрещен (требуется роль администратора)',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/list')
    public async getFilteredUsers(
        @Query('filterType') filterType?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userService.getFilteredUsers(
            filterType,
            page ?? 1,
            limit ?? 5,
        );
    }

    /**
     * Полнотекстовый поиск пользователей
     * GET /user/search?q=Иван Петров&page=1&limit=10
     * Ищет по email, имени, фамилии и телефону
     */
    @ApiOperation({
        summary: 'Полнотекстовый поиск пользователей',
        description:
            'Ищет пользователей по email, имени, фамилии и телефону. Минимальная длина запроса: 3 символа',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        description: 'Строка поиска (минимум 3 символа)',
        example: 'Иван Петров',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Номер страницы (по умолчанию: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Количество записей на странице (по умолчанию: 10)',
        example: 10,
    })
    @ApiResponse({
        status: 200,
        description: 'Список найденных пользователей',
        type: GetPaginatedUsersResponse,
    })
    @ApiResponse({
        status: 400,
        description: 'Некорректные параметры (пустая строка или < 3 символов)',
    })
    @ApiResponse({ status: 401, description: 'Не аутентифицирован' })
    @ApiResponse({
        status: 403,
        description: 'Доступ запрещен (требуется роль администратора)',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/search')
    public async searchUsers(
        @Query('q') query: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userService.fullTextSearchUsers(
            query,
            page ?? 1,
            limit ?? 10,
        );
    }

    /**
     * Поиск пользователей по префиксу телефона (автодополнение)
     * GET /user/search/phone?phone=+7999
     * Возвращает до 20 пользователей
     */
    @ApiOperation({
        summary: 'Поиск пользователей по префиксу телефона',
        description:
            'Ищет пользователей по началу номера телефона (автодополнение). Возвращает до 20 результатов. Минимальная длина: 3 символа',
    })
    @ApiQuery({
        name: 'phone',
        required: true,
        description: 'Префикс номера телефона (минимум 3 символа)',
        example: '+7999',
    })
    @ApiResponse({
        status: 200,
        description: 'Список найденных пользователей (до 20)',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    email: { type: 'string', example: 'user@example.com' },
                    phone: { type: 'string', example: '+79991234567' },
                    firstName: { type: 'string', example: 'Иван' },
                    lastName: { type: 'string', example: 'Петров' },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Некорректный префикс (пустой или < 3 символов)',
    })
    @ApiResponse({ status: 401, description: 'Не аутентифицирован' })
    @ApiResponse({
        status: 403,
        description: 'Доступ запрещен (требуется роль администратора)',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/search/phone')
    public async searchUsersByPhone(
        @Query('phone') phonePrefix: string,
    ): Promise<UserModel[]> {
        return this.userService.searchUsersByPhone(phonePrefix);
    }

    /**
     * Получить пользователей по массиву ID (batch запрос)
     * GET /user/batch?ids=1,2,3,4,5
     * Максимум 100 ID за раз
     */
    @ApiOperation({
        summary: 'Получить пользователей по массиву ID (batch)',
        description:
            'Возвращает список пользователей по массиву ID. Максимум 100 ID за один запрос. Возвращает только пользователей из текущего tenant',
    })
    @ApiQuery({
        name: 'ids',
        required: true,
        description: 'Массив ID пользователей через запятую (максимум 100)',
        example: '1,2,3,4,5',
    })
    @ApiResponse({
        status: 200,
        description: 'Список найденных пользователей',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'number', example: 1 },
                    email: { type: 'string', example: 'user@example.com' },
                    phone: { type: 'string', example: '+79991234567' },
                    firstName: { type: 'string', example: 'Иван' },
                    lastName: { type: 'string', example: 'Петров' },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description:
            'Некорректные ID (пустой массив, > 100, или не целые числа)',
    })
    @ApiResponse({ status: 401, description: 'Не аутентифицирован' })
    @ApiResponse({
        status: 403,
        description: 'Доступ запрещен (требуется роль администратора)',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/batch')
    public async getUsersBatch(
        @Query('ids') idsString: string,
    ): Promise<UserModel[]> {
        // Парсим строку "1,2,3" в массив чисел
        const ids = idsString
            .split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id));

        return this.userService.findUsersByIds(ids);
    }

    /**
     * Получить статистику пользователей по ролям
     * GET /user/admin/stats/by-role
     * Возвращает количество пользователей для каждой роли с процентами
     * ⚠️ ВАЖНО: Этот маршрут ДОЛЖЕН быть объявлен ДО /admin/stats (более специфичный маршрут)
     */
    @ApiOperation({
        summary: 'Получить статистику пользователей по ролям',
        description:
            'Возвращает статистику распределения пользователей по ролям с процентами от общего количества',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика по ролям успешно получена',
        schema: {
            type: 'object',
            properties: {
                roles: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            role: {
                                type: 'string',
                                example: 'USER',
                            },
                            count: {
                                type: 'number',
                                example: 1250,
                            },
                            percentage: {
                                type: 'number',
                                example: 85.5,
                            },
                        },
                    },
                },
                totalUsers: {
                    type: 'number',
                    example: 1450,
                },
            },
        },
    })
    @ApiBearerAuth('JWT-auth')
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/admin/stats/by-role')
    public async getUserStatsByRole(): Promise<{
        roles: Array<{ role: string; count: number; percentage: number }>;
        totalUsers: number;
    }> {
        return this.userService.getUserStatsByRole();
    }

    /**
     * Получить статистику активности пользователей
     * GET /user/admin/stats/activity
     * Возвращает статистику последней активности: за 24ч, 7д, 30д, никогда не логинились
     * ⚠️ ВАЖНО: Этот маршрут ДОЛЖЕН быть объявлен ДО /admin/stats (более специфичный маршрут)
     */
    @ApiOperation({
        summary: 'Получить статистику активности пользователей',
        description:
            'Возвращает статистику последней активности пользователей: активные за 24 часа, 7 дней, 30 дней и те, кто никогда не заходил',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика активности успешно получена',
        schema: {
            type: 'object',
            properties: {
                activeInLast24Hours: {
                    type: 'number',
                    example: 340,
                },
                activeInLast7Days: {
                    type: 'number',
                    example: 890,
                },
                activeInLast30Days: {
                    type: 'number',
                    example: 1200,
                },
                neverLoggedIn: {
                    type: 'number',
                    example: 150,
                },
                totalUsers: {
                    type: 'number',
                    example: 1450,
                },
            },
        },
    })
    @ApiBearerAuth('JWT-auth')
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/admin/stats/activity')
    public async getUserActivityStats(): Promise<{
        activeInLast24Hours: number;
        activeInLast7Days: number;
        activeInLast30Days: number;
        neverLoggedIn: number;
        totalUsers: number;
    }> {
        return this.userService.getUserActivityStats();
    }

    /**
     * Получить общую статистику пользователей
     * GET /user/admin/stats
     * Возвращает базовую статистику: всего, активных, заблокированных, подписчиков
     * ⚠️ ВАЖНО: Этот маршрут ДОЛЖЕН быть объявлен ПОСЛЕ более специфичных (by-role, activity)
     */
    @ApiOperation({
        summary: 'Получить общую статистику пользователей',
        description:
            'Возвращает базовую статистику пользователей: общее количество, активные, заблокированные, подписчики на рассылку',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика успешно получена',
        schema: {
            type: 'object',
            properties: {
                totalUsers: {
                    type: 'number',
                    example: 1450,
                },
                activeUsers: {
                    type: 'number',
                    example: 1200,
                },
                blockedUsers: {
                    type: 'number',
                    example: 50,
                },
                newsletterSubscribers: {
                    type: 'number',
                    example: 800,
                },
            },
        },
    })
    @ApiBearerAuth('JWT-auth')
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Get('/admin/stats')
    public async getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        newsletterSubscribers: number;
    }> {
        return this.userService.getUserStats();
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
    ): Promise<{ data: UpdateUserPreferencesResponse }> {
        const userId = this.extractUserId(req);

        // Обновляем preferences (инвалидирует кэш)
        await this.userService.updatePreferences(userId, dto);

        // Читаем обновлённые данные из кэша (или БД при cache miss)
        const user = await this.userService.getPreferences(userId);
        const plainUser = user.get({ plain: true });

        // Преобразуем translations из Record<string, string> (БД) в массив TranslationEntryDto[] (API)
        if (
            plainUser.translations &&
            typeof plainUser.translations === 'object'
        ) {
            plainUser.translations = Object.entries(plainUser.translations).map(
                ([key, value]) => ({ key, value: String(value) }),
            );
        }

        return this.createResponse(plainUser) as {
            data: UpdateUserPreferencesResponse;
        };
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

        // ⚠️ ВАЖНО: поле isBetaTester НЕ СУЩЕСТВУЕТ в UserModel
        // Возвращаем только id, так как все статусные поля были удалены из модели
        return {
            id: updatedUser.id,
        };
    }

    // ===== BULK OPERATIONS =====

    /**
     * Массовая активация пользователей (только для администраторов)
     * Активирует несколько пользователей одновременно (до 100)
     */
    @BulkActivateUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('bulk/activate')
    @HttpCode(HttpStatus.OK)
    async bulkActivateUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkActivateUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно активировано ${affectedCount} пользователей`,
        };
    }

    /**
     * Массовая деактивация пользователей (только для администраторов)
     * Деактивирует несколько пользователей одновременно (до 100)
     */
    @BulkDeactivateUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('bulk/deactivate')
    @HttpCode(HttpStatus.OK)
    async bulkDeactivateUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkDeactivateUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно деактивировано ${affectedCount} пользователей`,
        };
    }

    /**
     * Массовая блокировка пользователей (только для администраторов)
     * Блокирует несколько пользователей одновременно (до 100)
     */
    @BulkBlockUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('bulk/block')
    @HttpCode(HttpStatus.OK)
    async bulkBlockUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkBlockUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно заблокировано ${affectedCount} пользователей`,
        };
    }

    /**
     * Массовая разблокировка пользователей (только для администраторов)
     * Разблокирует несколько пользователей одновременно (до 100)
     */
    @BulkUnblockUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('bulk/unblock')
    @HttpCode(HttpStatus.OK)
    async bulkUnblockUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkUnblockUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно разблокировано ${affectedCount} пользователей`,
        };
    }

    /**
     * Массовое удаление пользователей (только для администраторов)
     * Выполняет soft delete для нескольких пользователей одновременно (до 100)
     */
    @BulkDeleteUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Delete('bulk/delete')
    @HttpCode(HttpStatus.OK)
    async bulkDeleteUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkDeleteUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно удалено ${affectedCount} пользователей`,
        };
    }

    /**
     * Массовая верификация пользователей (только для администраторов)
     * Верифицирует несколько пользователей одновременно (до 100)
     */
    @BulkVerifyUsersSwaggerDecorator()
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Post('bulk/verify')
    @HttpCode(HttpStatus.OK)
    async bulkVerifyUsers(
        @Body(validationPipe) dto: BulkUsersDto,
    ): Promise<BulkOperationResponse> {
        const affectedCount = await this.userService.bulkVerifyUsers(
            dto.userIds,
        );

        return {
            affectedCount,
            message: `Успешно верифицировано ${affectedCount} пользователей`,
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
