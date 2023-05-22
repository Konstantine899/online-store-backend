import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { Request, Response } from 'express';
import { CartModel } from './cart.model';
import { ProductModel } from '../product/product.model';
import { ProductRepository } from '../product/product.repository';

export class ISignedCookies {
  cartId: string;
}

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
  constructor(
	private readonly cartRepository: CartRepository,
	private readonly productRepository: ProductRepository,
  ) {}

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
	let { cartId } = request.signedCookies as { cartId: number };
	const { productId, quantity } = params;
	const product = await this.findProduct(productId);
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const foundCart = await this.findCart(cartId);
	const cart = await this.cartRepository.appendToCart(
		foundCart.id,
		product.id,
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
	const product = await this.findProduct(productId);
	let { cartId } = request.signedCookies as { cartId: number };
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const foundCart = await this.findCart(cartId);
	const cart = await this.cartRepository.increment(
		foundCart.id,
		product.id,
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
	const product = await this.findProduct(productId);
	let { cartId } = request.signedCookies as { cartId: number };
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const foundCart = await this.findCart(cartId);
	const cart = await this.cartRepository.decrement(
		foundCart.id,
		product.id,
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
	const product = await this.findProduct(productId);
	let { cartId } = request.signedCookies as { cartId: number };
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const foundCart = await this.findCart(cartId);
	const cart = await this.cartRepository.removeFromCart(
		foundCart.id,
		product.id,
	);
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
	let { cartId } = request.signedCookies as { cartId: number };
	if (!cartId) {
		const created = await this.cartRepository.createCart();
		cartId = created.id;
	}
	const foundCart = await this.findCart(cartId);
	const cart = await this.cartRepository.clearCart(foundCart.id);
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

  private async findCart(cartId: number): Promise<CartModel> {
	const foundCart = await this.cartRepository.findCart(cartId);
	if (!foundCart) {
		this.notFound(`Корзина с id:${cartId} не найдена в БД`);
	}
	return foundCart;
  }

  private async findProduct(id: number): Promise<ProductModel> {
	const product = await this.productRepository.fidProductByPkId(id);
	if (!product) {
		this.notFound(`Продукт с id:${id} не найден в БД`);
	}
	return product;
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
