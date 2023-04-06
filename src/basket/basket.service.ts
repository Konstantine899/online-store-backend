import { Injectable } from '@nestjs/common';
import { BasketRepository } from './basket.repository';
import { Request, Response } from 'express';
import { BasketModel } from './basket.model';

interface IParams {
  productId?: number;
  quantity?: number;
}

@Injectable()
export class BasketService {
  constructor(private readonly basketRepository: BasketRepository) {}

  maxAge: number = 60 * 60 * 1000 * 24 * 365;
  signed: boolean = true;

  public async getOneBasket(
	request: Request,
	response: Response,
  ): Promise<BasketModel> {
	let basket: BasketModel;
	const { basketId } = request.signedCookies;
	if (basketId) {
		basket = await this.basketRepository.findOneBasket(basketId);
	} else {
		basket = await this.basketRepository.createBasket();
	}
	response.cookie('basketId', basket.id, {
		maxAge: this.maxAge,
		signed: this.signed, // использую секретный ключ для подписки value
	});
	return basket;
  }

  public async appendToBasket(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<BasketModel> {
	let { basketId } = request.signedCookies;
	const { productId, quantity } = params;
	if (!basketId) {
		const created = await this.basketRepository.createBasket();
		basketId = created.id;
	}
	const basket = await this.basketRepository.appendToBasket(
		basketId,
		productId,
		quantity,
	);
	response.cookie('basketId', basket.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return basket;
  }

  public async increment(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<BasketModel> {
	const { productId, quantity } = params;
	let { basketId } = request.signedCookies;
	if (!basketId) {
		const created = await this.basketRepository.createBasket();
		basketId = created.id;
	}
	const basket = await this.basketRepository.increment(
		basketId,
		productId,
		quantity,
	);
	response.cookie('basketId', basket.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return basket;
  }

  public async decrement(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<BasketModel> {
	const { productId, quantity } = params;
	let { basketId } = request.signedCookies;
	if (!basketId) {
		const created = await this.basketRepository.createBasket();
		basketId = created.id;
	}
	const basket = await this.basketRepository.decrement(
		basketId,
		productId,
		quantity,
	);
	response.cookie('basketId', basket.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return basket;
  }

  public async removeFromBasket(request, response, params: IParams) {
	const { productId } = params;
	let { basketId } = request.signedCookies;
	if (!basketId) {
		const created = await this.basketRepository.createBasket();
		basketId = created.id;
	}
	const basket = await this.basketRepository.removeFromBasket(
		basketId,
		productId,
	);
	response.cookie('basketId', basket.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return basket;
  }
}
