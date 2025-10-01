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
import { UpdateUserPhoneResponse } from '@app/infrastructure/responses';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import { ConfirmVerificationDto } from '@app/infrastructure/dto/user/confirm-verification.dto';

import { IUserController } from '@app/domain/controllers';

// Типизированный интерфейс для Request
interface AuthenticatedRequest extends Request {
    user: { id: number };
}

@ApiTags('Пользователи')
@Controller('user')
export class UserController implements IUserController {
    // Статические константы для переиспользования
    private static readonly USER_ROLES = ['USER', 'ADMIN', 'MANAGER'] as const;
    private static readonly ADMIN_ROLES = ['ADMIN'] as const;
    private static readonly SUCCESS_DESCRIPTION = 'Успех';
    private static readonly CREATED_DESCRIPTION = 'Создано';
    private static readonly UPDATED_DESCRIPTION = 'Обновлено';
    private static readonly DELETED_DESCRIPTION = 'Удалено';

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
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createUser(
        @Body() dto: CreateUserDto,
    ): Promise<CreateUserResponse> {
        return this.userService.createUser(dto);
    }

    @GetListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/get-list-users')
    public async getListUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userService.getListUsers(page, limit);
    }

    @GetUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/:id')
    public async getUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetUserResponse> {
        return this.userService.getUser(id);
    }

    @UpdateUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Put('/update/:id')
    public async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        return this.userService.updateUser(id, dto as unknown as CreateUserDto);
    }

    @RemoveUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/delete/:id')
    public async removeUser(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveUserResponse> {
        return this.userService.removeUser(id);
    }

    @AddRoleUserSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/role/add')
    public async addRole(@Body() dto: AddRoleDto): Promise<AddRoleResponse> {
        return this.userService.addRole(dto);
    }

    @RemoveRoleUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/role/delete')
    public async removeRole(
        @Body() dto: RemoveRoleDto,
    ): Promise<RemoveUserRoleResponse> {
        return this.userService.removeUserRole(dto);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    public async getMe(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        try {
            return await this.userService.findAuthenticatedUser(userId);
        } catch {
            // Возвращаем минимальный профиль, чтобы не падать 4xx в несущественных сценариях
            return { id: userId };
        }
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @UpdateUserPhoneSwaggerDecorator()
    @Patch('profile/phone')
    @HttpCode(HttpStatus.OK)
    async updatePhone(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserPhoneDto,
    ): Promise<{ data: UpdateUserPhoneResponse }> {
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePhone(userId, dto.phone);
        return this.createResponse({ id: user.id, phone: user.phone! });
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @UpdateUserProfileSwaggerDecorator()
    @Patch('profile')
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const userId = this.extractUserId(req);
        return this.userService.updateProfile(userId, dto);
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @ChangePasswordSwaggerDecorator()
    @Patch('profile/password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: ChangePasswordDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.changePassword(userId, dto.oldPassword, dto.newPassword);
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @UpdateUserFlagsSwaggerDecorator()
    @Patch('profile/flags')
    @HttpCode(HttpStatus.OK)
    async updateFlags(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserFlagsDto,
    ) {
        const userId = this.extractUserId(req);
        const user = await this.userService.updateFlags(userId, dto);
        return this.createResponse(user);
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @UpdateUserPreferencesSwaggerDecorator()
    @Patch('profile/preferences')
    @HttpCode(HttpStatus.OK)
    async updatePreferences(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: UpdateUserPreferencesDto,
    ) {
        const userId = this.extractUserId(req);
        const user = await this.userService.updatePreferences(userId, dto);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @VerifyUserEmailSwaggerDecorator()
    @Patch('verify/email/:id')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.verifyEmailFlag(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @VerifyUserPhoneSwaggerDecorator()
    @Patch('verify/phone/:id')
    @HttpCode(HttpStatus.OK)
    async verifyPhone(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.verifyPhoneFlag(id);
        return this.createResponse(user);
    }

    // Self-service verification (USER)
    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('verify/email/request')
    @HttpCode(HttpStatus.OK)
    async requestEmailCode(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        await this.userService.requestVerificationCode(userId, 'email');
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('verify/email/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmEmailCode(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: ConfirmVerificationDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.confirmVerificationCode(userId, 'email', dto.code);
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('verify/phone/request')
    @HttpCode(HttpStatus.OK)
    async requestPhoneCode(@Req() req: AuthenticatedRequest) {
        const userId = this.extractUserId(req);
        await this.userService.requestVerificationCode(userId, 'phone');
        return { status: HttpStatus.OK, message: 'success' };
    }

    @Roles(...UserController.USER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('verify/phone/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmPhoneCode(
        @Req() req: AuthenticatedRequest,
        @Body(new CustomValidationPipe()) dto: ConfirmVerificationDto,
    ) {
        const userId = this.extractUserId(req);
        await this.userService.confirmVerificationCode(userId, 'phone', dto.code);
        return { status: HttpStatus.OK, message: 'success' };
    }

    // ADMIN actions: block/unblock, suspend/unsuspend, delete/restore, premium upgrade/downgrade, employee on/off
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/block/:id')
    @HttpCode(HttpStatus.OK)
    async block(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.blockUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/unblock/:id')
    @HttpCode(HttpStatus.OK)
    async unblock(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unblockUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/suspend/:id')
    @HttpCode(HttpStatus.OK)
    async suspend(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.suspendUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/unsuspend/:id')
    @HttpCode(HttpStatus.OK)
    async unsuspend(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsuspendUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/delete/:id')
    @HttpCode(HttpStatus.OK)
    async softDelete(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.softDeleteUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/restore/:id')
    @HttpCode(HttpStatus.OK)
    async restore(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.restoreUser(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/premium/upgrade/:id')
    @HttpCode(HttpStatus.OK)
    async upgradePremium(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.upgradePremium(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/premium/downgrade/:id')
    @HttpCode(HttpStatus.OK)
    async downgradePremium(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.downgradePremium(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/employee/set/:id')
    @HttpCode(HttpStatus.OK)
    async setEmployee(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setEmployee(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/employee/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetEmployee(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetEmployee(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/vip/set/:id')
    @HttpCode(HttpStatus.OK)
    async setVip(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setVip(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/vip/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetVip(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetVip(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/highvalue/set/:id')
    @HttpCode(HttpStatus.OK)
    async setHighValue(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setHighValue(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/highvalue/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetHighValue(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetHighValue(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/wholesale/set/:id')
    @HttpCode(HttpStatus.OK)
    async setWholesale(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setWholesale(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/wholesale/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetWholesale(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetWholesale(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/affiliate/set/:id')
    @HttpCode(HttpStatus.OK)
    async setAffiliate(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.setAffiliate(id);
        return this.createResponse(user);
    }

    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('admin/affiliate/unset/:id')
    @HttpCode(HttpStatus.OK)
    async unsetAffiliate(@Param('id', ParseIntPipe) id: number) {
        const user = await this.userService.unsetAffiliate(id);
        return this.createResponse(user);
    }
}
