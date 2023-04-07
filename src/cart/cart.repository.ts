import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CartModel } from './cart.model';
import { ProductModel } from '../product/product.model';
import { CartProductModel } from './cart-product.model';

@Injectable()
export class CartRepository {
  constructor(
	@InjectModel(CartModel) private cartModel: typeof CartModel,
	@InjectModel(CartProductModel)
	private cartProductModel: typeof CartProductModel,
  ) {}

  public async findCart(cartId: number): Promise<CartModel> {
	return this.cartModel.findByPk(cartId, {
		attributes: [`id`],
		include: [{ model: ProductModel, attributes: [`id`, `name`, `price`] }],
	});
  }

  public async createCart(): Promise<CartModel> {
	return this.cartModel.create();
  }

  public async appendToCart(
	cartId: number,
	productId: number,
	quantity: number,
  ): Promise<CartModel> {
	let cart = await this.cartModel.findByPk(cartId, {
		attributes: [`id`],
		include: [{ model: ProductModel, attributes: ['id', 'name', 'price'] }],
	});

	if (!cart) {
		cart = await this.cartModel.create();
	}

	const cart_product = await this.cartProductModel.findOne({
		where: { cartId, productId },
	});

	if (cart_product) {
		await cart_product.increment(`quantity`, { by: quantity });
	}
	await this.cartProductModel.create({
		cartId,
		productId,
		quantity,
	});
	await cart.reload();
	return cart;
  }

  public async increment(
	cartId: number,
	productId: number,
	quantity: number,
  ): Promise<CartModel> {
	let cart = await this.cartModel.findByPk(cartId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!cart) {
		cart = await this.cartModel.create();
	}

	const cart_product = await this.cartProductModel.findOne({
		where: { cartId, productId },
	});
	if (cart_product) {
		await cart_product.increment(`quantity`, { by: quantity });
		await cart.reload();
	}
	return cart;
  }

  public async decrement(cartId, productId, quantity): Promise<CartModel> {
	let cart = await this.cartModel.findByPk(cartId, {
		include: { model: ProductModel, as: 'products' },
	});
	if (!cart) {
		cart = await this.cartModel.create();
	}

	const cart_product = await this.cartProductModel.findOne({
		where: { cartId, productId },
	});
	// Если продукт в корзине не найден удаляем его из таблицы CartProductModel
	if (!cart_product) {
		await cart_product.destroy();
	}
	// если количество продуктов в корзине больше переданного количества,
	// то уменьшаем количество товаров в корзине
	if (cart_product.quantity > quantity) {
		await cart_product.decrement('quantity', { by: quantity });
	}
	// Обновляю объект корзины, что бы подтянуть обновленные данные
	await cart.reload();
	return cart;
  }

  public async removeFromCart(
	cartId: number,
	productId: number,
  ): Promise<CartModel> {
	const cart = await this.cartModel.findByPk(cartId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!cart) {
		await this.cartModel.create();
	}
	const cart_product = await this.cartProductModel.findOne({
		where: { cartId, productId },
	});
	if (cart_product) {
		await cart_product.destroy();
		await cart.reload();
	}
	return cart;
  }

  public async clearCart(cartId: number): Promise<CartModel> {
	let cart = await this.cartModel.findByPk(cartId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!cart) {
		cart = await this.cartModel.create();
	}
	await this.cartProductModel.destroy({ where: { cartId } });
	await cart.reload();
	return cart;
  }
}
