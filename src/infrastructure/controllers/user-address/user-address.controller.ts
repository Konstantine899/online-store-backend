import { Roles } from '@app/infrastructure/common/decorators';
import {
    CreateUserAddressSwaggerDecorator,
    GetUserAddressSwaggerDecorator,
    GetUserAddressesSwaggerDecorator,
    RemoveUserAddressSwaggerDecorator,
    SetDefaultUserAddressSwaggerDecorator,
    UpdateUserAddressSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/user-address';
import { AuthGuard, RoleGuard } from '@app/infrastructure/common/guards';
import {
    CreateUserAddressDto,
    UpdateUserAddressDto,
} from '@app/infrastructure/dto';
import {
    CreateUserAddressResponse,
    GetUserAddressResponse,
    RemoveUserAddressResponse,
    UpdateUserAddressResponse,
} from '@app/infrastructure/responses';
import { UserAddressService } from '@app/infrastructure/services';
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

// Типизированный интерфейс для Request
interface AuthenticatedRequest extends Request {
    user: { id: number };
}

@ApiTags('Адреса пользователя')
@ApiBearerAuth('JWT-auth')
@Controller('user-addresses')
@UseGuards(AuthGuard, RoleGuard)
export class UserAddressController {
    // Статические константы для переиспользования
    private static readonly USER_ROLES = [
        'VIP_CUSTOMER',
        'WHOLESALE',
        'CUSTOMER',
        'AFFILIATE',
        'GUEST',
        'USER',
        'ADMIN',
    ] as const;
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
    async getAddresses(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ data: GetUserAddressResponse[] }> {
        const data = await this.userAddressService.getAddresses(
            this.extractUserId(req),
        );
        return this.createResponse(data);
    }

    @GetUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: GetUserAddressResponse }> {
        const data = await this.userAddressService.getAddress(
            this.extractUserId(req),
            id,
        );
        return this.createResponse(data);
    }

    @CreateUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createAddress(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateUserAddressDto,
    ): Promise<{ data: CreateUserAddressResponse }> {
        const data = await this.userAddressService.createAddress(
            this.extractUserId(req),
            dto,
        );
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
    ): Promise<{ data: UpdateUserAddressResponse }> {
        const data = await this.userAddressService.updateAddress(
            this.extractUserId(req),
            id,
            dto,
        );
        return this.createResponse(data);
    }

    @RemoveUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async removeAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RemoveUserAddressResponse> {
        return this.userAddressService.removeAddress(
            this.extractUserId(req),
            id,
        );
    }

    @SetDefaultUserAddressSwaggerDecorator()
    @Roles(...UserAddressController.USER_ROLES)
    @Patch(':id/set-default')
    @HttpCode(HttpStatus.OK)
    async setDefaultAddress(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ data: UpdateUserAddressResponse }> {
        const data = await this.userAddressService.setDefaultAddress(
            this.extractUserId(req),
            id,
        );
        return this.createResponse(data);
    }
}
