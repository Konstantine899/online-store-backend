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
import { CartService } from './cart.service';
import { Request, Response } from 'express';
import { AppendToCartDocumentation } from './decorators/append-to-cart.documentation';
import { ApiTags } from '@nestjs/swagger';
import { GetCartDocumentation } from './decorators/get-cart.documentation';
import { IncrementDocumentation } from './decorators/increment.documentation';
import { DecrementDocumentation } from './decorators/decrement.documentation';
import { RemoveProductFromCartDocumentation } from './decorators/remove-product-from-cart.documentation';
import { ClearCartDocumentation } from './decorators/clear-cart.documentation';

@ApiTags(`Корзина`)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @GetCartDocumentation()
  @HttpCode(200)
  @Get('/get-cart')
  public async getCart(
	@Req() request: Request,
	// passthrough: true дает возможность использовать не только cookie, но и другие возможности framework
	@Res({ passthrough: true }) response: Response,
  ) {
	return this.cartService.getCart(request, response);
  }

  @AppendToCartDocumentation()
  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/append/:quantity([0-9]+)')
  public async appendToCart(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.cartService.appendToCart(request, response, {
		productId,
		quantity,
	});
  }

  @IncrementDocumentation()
  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/increment/:quantity([0-9]+)')
  public async increment(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.cartService.increment(request, response, {
		productId,
		quantity,
	});
  }

  @DecrementDocumentation()
  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/decrement/:quantity([0-9]+)')
  public async decrement(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.cartService.decrement(request, response, {
		productId,
		quantity,
	});
  }

  @RemoveProductFromCartDocumentation()
  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/remove')
  public async removeProductFromCart(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
  ) {
	return this.cartService.removeProductFromCart(request, response, {
		productId,
	});
  }

  @ClearCartDocumentation()
  @HttpCode(200)
  @Put('/clear')
  public async clearCart(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
  ) {
	return this.cartService.clearCart(request, response);
  }
}
