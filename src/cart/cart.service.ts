import { Injectable } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { Request, Response } from 'express';
import { CartModel } from './cart.model';
import { ProductModel } from '../product/product.model';

interface IParams {
  productId?: number;
  quantity?: number;
}

export interface ITransformData {
  cartId: number;
  products: ProductModel[];
}

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  maxAge: number = 60 * 60 * 1000 * 24 * 365;
  signed: boolean = true;

  public async getCart(
	request: Request,
	response: Response,
  ): Promise<ITransformData> {
	let cart: CartModel;
	const { cartId } = request.signedCookies;
	if (cartId) {
		cart = await this.cartRepository.findCart(cartId);
	} else {
		cart = await this.cartRepository.createCart();
	}

	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed, // использую секретный ключ для подписки value
	});
	return this.TransformData(cart);
  }

  public async appendToCart(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<ITransformData> {
	let { cartId } = request.signedCookies;
	const { productId, quantity } = params;
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const cart = await this.cartRepository.appendToCart(
		cartId,
		productId,
		quantity,
	);
	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return this.TransformData(cart);
  }

  public async increment(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<ITransformData> {
	const { productId, quantity } = params;
	let { cartId } = request.signedCookies;
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const cart = await this.cartRepository.increment(
		cartId,
		productId,
		quantity,
	);
	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return this.TransformData(cart);
  }

  public async decrement(
	request: Request,
	response: Response,
	params: IParams,
  ): Promise<ITransformData> {
	const { productId, quantity } = params;
	let { cartId } = request.signedCookies;
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const cart = await this.cartRepository.decrement(
		cartId,
		productId,
		quantity,
	);
	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return this.TransformData(cart);
  }

  public async removeProductFromCart(
	request,
	response,
	params: IParams,
  ): Promise<ITransformData> {
	const { productId } = params;
	let { cartId } = request.signedCookies;
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const cart = await this.cartRepository.removeFromCart(cartId, productId);
	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return this.TransformData(cart);
  }

  public async clearCart(
	request: Request,
	response: Response,
  ): Promise<ITransformData> {
	let { cartId } = request.signedCookies;
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const cart = await this.cartRepository.clearCart(cartId);
	response.cookie('cartId', cart.id, {
		maxAge: this.maxAge,
		signed: this.signed,
	});
	return this.TransformData(cart);
  }

  private TransformData(cart: any): ITransformData {
	const data: ITransformData = {
		cartId: undefined,
		products: undefined,
	};
	data.products = [];

	data.cartId = cart.id;
	if (cart.products) {
		data.products = cart.products.map((item) => {
		return {
			productId: item.id,
			name: item.name,
			price: item.price,
			quantity: item['CartProductModel'].quantity,
		};
		});
	}
	return data;
  }
}
