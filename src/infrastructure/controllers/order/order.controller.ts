import { IOrderController } from '@app/domain/controllers';
import {
    AdminCreateOrderSwaggerDecorator,
    AdminGetOrderListUsersSwaggerDecorator,
    AdminGetOrderUserSwaggerDecorator,
    AdminGetStoreOrderListSwaggerDecorator,
    AdminRemoveOrderSwaggerDecorator,
    GuestCreateOrderSwaggerDecorator,
    Roles,
    UserCreateOrderSwaggerDecorator,
    UserGetOrderListSwaggerDecorator,
    UserGetOrderSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { AuthGuard, RoleGuard } from '@app/infrastructure/common/guards';
import {
    OrderDto,
    SignedCookiesDto,
    UserOrderDto,
} from '@app/infrastructure/dto';
import {
    AdminCreateOrderResponse,
    AdminGetOrderListUserResponse,
    AdminGetOrderUserResponse,
    AdminGetStoreOrderListResponse,
    AdminRemoveOrderResponse,
    GuestCreateOrderResponse,
    UserCreateOrderResponse,
    UserGetOrderListResponse,
    UserGetOrderResponse,
} from '@app/infrastructure/responses';
import { OrderService } from '@app/infrastructure/services';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Заказы')
@Controller('order')
export class OrderController implements IOrderController {
    constructor(private readonly orderService: OrderService) {}

    /*Для администратора*/

    /*Получение списка всех заказов магазина*/
    @AdminGetStoreOrderListSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/admin/get-all-order')
    public async adminGetStoreOrderList(): Promise<
        AdminGetStoreOrderListResponse[]
    > {
        return this.orderService.adminGetStoreOrderList();
    }

    /*Получение списка заказов пользователя*/
    @AdminGetOrderListUsersSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/admin/get-all-order/user/:userId')
    public async adminGetOrderListUser(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<AdminGetOrderListUserResponse[]> {
        return this.orderService.adminGetOrderListUser(userId);
    }

    /*Получение заказа пользователя по id заказа*/
    @AdminGetOrderUserSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/admin/get-order/:orderId')
    public async adminGetOrderUser(
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<AdminGetOrderUserResponse> {
        return this.orderService.adminGetOrderUser(orderId);
    }

    /*Создание заказа для пользователя администратором*/
    @AdminCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/admin/create-order')
    public async adminCreateOrder(
        @Body() dto: OrderDto,
    ): Promise<AdminCreateOrderResponse> {
        return this.orderService.adminCreateOrder(dto);
    }

    /*Администратор Удаление заказа*/
    @AdminRemoveOrderSwaggerDecorator()
    @HttpCode(200)
    @Roles('ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/admin/delete-order/:orderId')
    public async adminRemoveOrder(
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<AdminRemoveOrderResponse> {
        return this.orderService.adminRemoveOrder(orderId);
    }

    /*Для авторизованного пользователя*/

    /*Получение списка заказов пользователя*/
    @UserGetOrderListSwaggerDecorator()
    @HttpCode(200)
    @Roles('USER', 'CUSTOMER')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/user/get-all-order')
    public async userGetOrderList(
        @Req() request: Request,
    ): Promise<UserGetOrderListResponse[]> {
        const { id } = request.user as UserOrderDto;
        return this.orderService.userGetOrderList(id);
    }

    /*Получение одного заказа пользователя*/
    @UserGetOrderSwaggerDecorator()
    @HttpCode(200)
    @Roles('USER', 'CUSTOMER')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/user/get-order/:orderId')
    public async userGetOrder(
        @Req() request: Request,
        @Param('orderId', ParseIntPipe) orderId: number,
    ): Promise<UserGetOrderResponse> {
        const { id } = request.user as UserOrderDto;
        return this.orderService.userGetOrder(orderId, id);
    }

    @UserCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Roles('USER', 'CUSTOMER')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/user/create-order')
    public async userCreateOrder(
        @Req() request: Request,
        @Body() dto: Omit<OrderDto, 'userId'>,
    ): Promise<UserCreateOrderResponse> {
        const { id } = request.user as UserOrderDto;
        const { cartId } = request.signedCookies as SignedCookiesDto;
        return this.orderService.userCreateOrder(dto, id, cartId);
    }

    /*Для не авторизованного пользователя*/

    @GuestCreateOrderSwaggerDecorator()
    @HttpCode(201)
    @Post('/guest/create-order')
    public async guestCreateOrder(
        @Req() request: Request,
        @Body() dto: OrderDto,
    ): Promise<GuestCreateOrderResponse> {
        const { cartId } = request.signedCookies;
        return this.orderService.guestCreateOrder(dto, undefined, cartId);
    }
}
