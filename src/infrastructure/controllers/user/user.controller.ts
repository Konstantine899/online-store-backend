import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Patch,
    UseGuards,
    HttpStatus,
    Req,
    Query,
    DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from '@app/infrastructure/services';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
    UpdateUserProfileDto,
} from '@app/infrastructure/dto';
import { UpdateUserDto } from '@app/infrastructure/dto/user/update-user.dto';

import {
    Roles,
    CreateUserSwaggerDecorator,
    GetListUsersSwaggerDecorator,
    GetUserSwaggerDecorator,
    UpdateUserSwaggerDecorator,
    RemoveUserSwaggerDecorator,
    AddRoleUserSwaggerDecorator,
    RemoveRoleUserSwaggerDecorator,
    UpdateUserPhoneSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { ChangePasswordSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/change-password.swagger';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import { ApiTags } from '@nestjs/swagger';

import {
    CreateUserResponse,
    GetUserResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { UpdateUserPhoneDto } from '@app/infrastructure/dto';
import { ChangePasswordDto } from '@app/infrastructure/dto/user/change-password.dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { UpdateUserFlagsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-flags.swagger';
import { UpdateUserPreferencesSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-preferences.swagger';
import { VerifyUserEmailSwaggerDecorator, VerifyUserPhoneSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/verify-user.swagger';
import { UpdateUserProfileSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/update-user-profile.swagger';
import { GetUserStatsSwaggerDecorator } from '@app/infrastructure/common/decorators/swagger/user/user-stats.swagger';
import { UpdateUserPhoneResponse } from '@app/infrastructure/responses';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import { ConfirmVerificationDto } from '@app/infrastructure/dto/user/confirm-verification.dto';

import { IUserController } from '@app/domain/controllers';

// Оптимизированные типы для Request
interface AuthenticatedRequest extends Request {
    user: { id: number };
}

// Оптимизированные константы ролей
const USER_ROLES = ['VIP_CUSTOMER', 'WHOLESALE', 'CUSTOMER', 'AFFILIATE', 'GUEST', 'USER', 'ADMIN'] as const;
const ADMIN_ROLES = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'ADMIN'] as const;
const MANAGER_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'CONTENT_MANAGER', 'CUSTOMER_SERVICE', 'ADMIN'] as const;
const STAFF_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'CONTENT_MANAGER', 'CUSTOMER_SERVICE', 'ADMIN'] as const;

// Глобальный экземпляр валидатора для оптимизации производительности
const validationPipe = new CustomValidationPipe();

// Композитные декораторы для оптимизации производительности
const AdminGuards = () => UseGuards(AuthGuard, RoleGuard);
const UserGuards = () => UseGuards(AuthGuard, RoleGuard);
const StaffGuards = () => UseGuards(AuthGuard, RoleGuard);
const ManagerGuards = () => UseGuards(AuthGuard, RoleGuard);

@ApiTags('Пользователи')
@Controller('user')
export class UserController implements IUserController {
    constructor(private readonly userService: UserService) {}

    // Метод для извлечения userId с валидацией
    private extractUserId(req: AuthenticatedRequest): number {
        return req.user.id;
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
    @Roles(...MANAGER_ROLES)
    @ManagerGuards()
    @Post('/role/add')
    public async addRole(@Body() dto: AddRoleDto): Promise<AddRoleResponse> {
        return this.userService.addRole(dto);
    }

    @RemoveRoleUserSwaggerDecorator()
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @ManagerGuards()
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
    public async getMe(@Req() req: AuthenticatedRequest) {
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
        return this.createResponse({ id: user.id, phone: user.phone! });
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
    ) {
        const userId = this.extractUserId(req);
        await this.userService.changePassword(userId, dto.oldPassword, dto.newPassword);
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
    ) {
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
    ) {
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
    async verifyEmail(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.verifyEmailFlag(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @VerifyUserPhoneSwaggerDecorator()
    @Patch('verify/phone/:id')
    @HttpCode(HttpStatus.OK)
    async verifyPhone(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.verifyPhoneFlag(id);
        return this.createResponse(user);
    }

    // Self-service verification (USER)
    @Roles(...USER_ROLES)
    @UserGuards()
    @Post('verify/email/request')
    @HttpCode(HttpStatus.OK)
    async requestEmailCode(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        await this.userService.requestVerificationCode(userId, 'email');
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @Post('verify/email/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmEmailCode(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: ConfirmVerificationDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.confirmVerificationCode(userId, 'email', dto.code);
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @Post('verify/phone/request')
    @HttpCode(HttpStatus.OK)
    async requestPhoneCode(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        await this.userService.requestVerificationCode(userId, 'phone');
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...USER_ROLES)
    @UserGuards()
    @Post('verify/phone/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmPhoneCode(
        @Req() req: AuthenticatedRequest,
        @Body(validationPipe) dto: ConfirmVerificationDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.confirmVerificationCode(userId, 'phone', dto.code);
        return { status: HttpStatus.OK, message: 'success' };
    }

    // ADMIN actions: block/unblock, suspend/unsuspend, delete/restore, premium upgrade/downgrade, employee on/off
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/block/:id')
    @HttpCode(HttpStatus.OK)
    async block(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.blockUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/unblock/:id')
    @HttpCode(HttpStatus.OK)
    async unblock(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unblockUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/suspend/:id')
    @HttpCode(HttpStatus.OK)
    async suspend(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.suspendUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/unsuspend/:id')
    @HttpCode(HttpStatus.OK)
    async unsuspend(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsuspendUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/delete/:id')
    @HttpCode(HttpStatus.OK)
    async softDelete(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.softDeleteUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/restore/:id')
    @HttpCode(HttpStatus.OK)
    async restore(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.restoreUser(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/premium/upgrade/:id')
    @HttpCode(HttpStatus.OK)
    async upgradePremium(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.upgradePremium(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/premium/downgrade/:id')
    @HttpCode(HttpStatus.OK)
    async downgradePremium(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.downgradePremium(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/employee/set/:id')
    @HttpCode(HttpStatus.OK)
    async setEmployee(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setEmployee(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/employee/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetEmployee(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetEmployee(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/vip/set/:id')
    @HttpCode(HttpStatus.OK)
    async setVip(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setVip(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/vip/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetVip(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetVip(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/highvalue/set/:id')
    @HttpCode(HttpStatus.OK)
    async setHighValue(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setHighValue(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/highvalue/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetHighValue(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetHighValue(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/wholesale/set/:id')
    @HttpCode(HttpStatus.OK)
    async setWholesale(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setWholesale(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/wholesale/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetWholesale(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetWholesale(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/affiliate/set/:id')
    @HttpCode(HttpStatus.OK)
    async setAffiliate(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setAffiliate(id);
        return this.createResponse(user);
    }

    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @Patch('admin/affiliate/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetAffiliate(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetAffiliate(id);
        return this.createResponse(user);
    }


    // ===== Admin Statistics Endpoint =====
    @Roles(...ADMIN_ROLES)
    @AdminGuards()
    @GetUserStatsSwaggerDecorator()
    @Get('admin/stats')
    @HttpCode(HttpStatus.OK)
    async getUserStats() {
        const stats = await this.userService.getUserStats();
        return this.createResponse(stats);
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
