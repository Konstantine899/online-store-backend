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
import { BasketService } from './basket.service';
import { Request, Response } from 'express';

@Controller('basket')
export class BasketController {
  constructor(private readonly basketService: BasketService) {}

  @HttpCode(200)
  @Get('/getone')
  public async getOneBasket(
	@Req() request: Request,
	// passthrough: true дает возможность использовать не только cookie, но и другие возможности framework
	@Res({ passthrough: true }) response: Response,
  ) {
	return this.basketService.getOneBasket(request, response);
  }

  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/append/:quantity([0-9]+)')
  public async append(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.basketService.appendToBasket(request, response, {
		productId,
		quantity,
	});
  }

  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/increment/:quantity([0-9]+)')
  public async increment(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.basketService.increment(request, response, {
		productId,
		quantity,
	});
  }

  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/decrement/:quantity([0-9]+)')
  public async decrement(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
	@Param('quantity', ParseIntPipe) quantity: number,
  ) {
	return this.basketService.decrement(request, response, {
		productId,
		quantity,
	});
  }

  @HttpCode(200)
  @Put('/product/:productId([0-9]+)/remove')
  public async remove(
	@Req() request: Request,
	@Res({ passthrough: true }) response: Response,
	@Param('productId', ParseIntPipe) productId: number,
  ) {
	return this.basketService.removeFromBasket(request, response, {
		productId,
	});
  }

  @HttpCode(200)
  @Put('/clear')
  public async clear() {}
}
