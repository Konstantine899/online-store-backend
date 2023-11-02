import {
    Controller,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Put,
    Req,
    Res,
} from '@nestjs/common';
import { CartService } from '../../services/cart/cart.service';
import { Request, Response } from 'express';
import { AppendToCartSwaggerDecorator } from '../../common/decorators/swagger/cart/append-to-cart-swagger-decorator';
import { ApiTags } from '@nestjs/swagger';

import { CartResponse } from '../../responses/cart/cart.response';
import { AppendToCartResponse } from '../../responses/cart/append-to-cart.response';
import { IncrementResponse } from '../../responses/cart/increment.response';
import { DecrementResponse } from '../../responses/cart/decrement.response';
import { RemoveProductFromCartResponse } from '../../responses/cart/remove-product-from-cart.response';
import { ClearCartResponse } from '../../responses/cart/clear-cart.response';
import { GetCartSwaggerDecorator } from '../../common/decorators/swagger/cart/get-cart-swagger-decorator';
import { IncrementSwaggerDecorator } from '../../common/decorators/swagger/cart/increment-swagger-decorator';
import { DecrementSwaggerDecorator } from '../../common/decorators/swagger/cart/decrement-swagger-decorator';
import { RemoveProductFromCartSwaggerDecorator } from '../../common/decorators/swagger/cart/remove-product-from-cart-swagger-decorator';
import { ClearCartSwaggerDecorator } from '../../common/decorators/swagger/cart/clear-cart-swagger-decorator';
import { ICartController } from '../../../domain/controllers/i-cart-controller';

@ApiTags('Корзина')
@Controller('cart')
export class CartController implements ICartController {
    constructor(private readonly cartService: CartService) {}

    @GetCartSwaggerDecorator()
    @HttpCode(200)
    @Get('/get-cart')
    public async getCart(
        @Req() request: Request,
        // passthrough: true дает возможность использовать не только cookie, но и другие возможности framework
        @Res({ passthrough: true }) response: Response,
    ): Promise<CartResponse> {
        return this.cartService.getCart(request, response);
    }

    @AppendToCartSwaggerDecorator()
    @HttpCode(200)
    @Put('/product/:productId([0-9]+)/append/:quantity([0-9]+)')
    public async appendToCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('quantity', ParseIntPipe) quantity: number,
    ): Promise<AppendToCartResponse> {
        return this.cartService.appendToCart(
            request,
            response,
            productId,
            quantity,
        );
    }

    @IncrementSwaggerDecorator()
    @HttpCode(200)
    @Put('/product/:productId([0-9]+)/increment/:quantity([0-9]+)')
    public async increment(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('quantity', ParseIntPipe) quantity: number,
    ): Promise<IncrementResponse> {
        return this.cartService.increment(
            request,
            response,
            productId,
            quantity,
        );
    }

    @DecrementSwaggerDecorator()
    @HttpCode(200)
    @Put('/product/:productId([0-9]+)/decrement/:quantity([0-9]+)')
    public async decrement(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Param('productId', ParseIntPipe) productId: number,
        @Param('quantity', ParseIntPipe) quantity: number,
    ): Promise<DecrementResponse> {
        return this.cartService.decrement(
            request,
            response,
            productId,
            quantity,
        );
    }

    @RemoveProductFromCartSwaggerDecorator()
    @HttpCode(200)
    @Put('/product/:productId([0-9]+)/remove')
    public async removeProductFromCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
        @Param('productId', ParseIntPipe) productId: number,
    ): Promise<RemoveProductFromCartResponse> {
        return this.cartService.removeProductFromCart(
            request,
            response,
            productId,
        );
    }

    @ClearCartSwaggerDecorator()
    @HttpCode(200)
    @Put('/clear')
    public async clearCart(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ClearCartResponse> {
        return this.cartService.clearCart(request, response);
    }
}
