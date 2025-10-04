import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserAddressService } from '@app/infrastructure/services';
import { CreateUserAddressDto, UpdateUserAddressDto } from '@app/infrastructure/dto';
import { AuthGuard, RoleGuard } from '@app/infrastructure/common/guards';
import { Roles } from '@app/infrastructure/common/decorators';
import { 
    GetUserAddressesSwaggerDecorator,
    GetUserAddressSwaggerDecorator,
    CreateUserAddressSwaggerDecorator,
    UpdateUserAddressSwaggerDecorator,
    RemoveUserAddressSwaggerDecorator,
    SetDefaultUserAddressSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/user-address';

// Типизированный интерфейс для Request
interface AuthenticatedRequest extends Request {
    user: { id: number };
}

@ApiTags('Адреса пользователя')
@ApiBearerAuth('JWT-auth')
@Controller('user/addresses')
@UseGuards(AuthGuard, RoleGuard)
export class UserAddressController {
    // Статические константы для переиспользования
    private static readonly USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;
    private static readonly SUCCESS_DESCRIPTION = 'Успех';
    private static readonly CREATED_DESCRIPTION = 'Создано';
    private static readonly UPDATED_DESCRIPTION = 'Обновлено';
    private static readonly DELETED_DESCRIPTION = 'Удалено';

    constructor(private readonly userAddressService: UserAddressService) {}

    // Метод для извлечения userId с валидацией
    private extractUserId(req: AuthenticatedRequest): number {
        return req.user.id;
    }

    // Метод для создания ответа
    private createResponse<T>(data: T): { data: T } {
        return { data };
    }

    @GetUserAddressesSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAddresses(@Req() req: AuthenticatedRequest) {
        const data = await this.userAddressService.getAddresses(this.extractUserId(req));
        return this.createResponse(data);
    }

    @GetUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const data = await this.userAddressService.getAddress(this.extractUserId(req), id);
        return this.createResponse(data);
    }

    @CreateUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createAddress(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateUserAddressDto,
    ) {
        const data = await this.userAddressService.createAddress(this.extractUserId(req), dto);
        return this.createResponse(data);
    }

    @UpdateUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async updateAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserAddressDto,
    ) {
        const data = await this.userAddressService.updateAddress(this.extractUserId(req), id, dto);
        return this.createResponse(data);
    }

    @RemoveUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async removeAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.userAddressService.removeAddress(this.extractUserId(req), id);
    }

    @SetDefaultUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Patch(':id/set-default')
    @HttpCode(HttpStatus.OK)
    async setDefaultAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const data = await this.userAddressService.setDefaultAddress(this.extractUserId(req), id);
        return this.createResponse(data);
    }
}