import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasketModel } from './basket.model';
import { ProductModel } from '../product/product.model';
import { BasketProductModel } from './basket-product.model';

@Injectable()
export class BasketRepository {
  constructor(
	@InjectModel(BasketModel) private basketModel: typeof BasketModel,
	@InjectModel(BasketProductModel)
	private basketProductModel: typeof BasketProductModel,
  ) {}

  public async findOneBasket(basketId: number): Promise<BasketModel> {
	return this.basketModel.findByPk(basketId, {
		attributes: [`id`],
		include: [{ model: ProductModel, attributes: [`id`, `name`, `price`] }],
	});
  }

  public async createBasket(): Promise<BasketModel> {
	return this.basketModel.create();
  }

  public async appendToBasket(
	basketId: number,
	productId: number,
	quantity: number,
  ): Promise<BasketModel> {
	let basket = await this.basketModel.findByPk(basketId, {
		attributes: [`id`],
		include: [{ model: ProductModel, attributes: ['id', 'name', 'price'] }],
	});

	if (!basket) {
		basket = await this.basketModel.create();
	}

	const basket_product = await this.basketProductModel.findOne({
		where: { basketId, productId },
	});

	if (basket_product) {
		await basket_product.increment(`quantity`, { by: quantity });
	}
	await this.basketProductModel.create({ basketId, productId, quantity });
	await basket.reload();
	return basket;
  }

  public async increment(
	basketId: number,
	productId: number,
	quantity: number,
  ): Promise<BasketModel> {
	let basket = await this.basketModel.findByPk(basketId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!basket) {
		basket = await this.basketModel.create();
	}

	const basket_product = await this.basketProductModel.findOne({
		where: { basketId, productId },
	});
	if (basket_product) {
		await basket_product.increment(`quantity`, { by: quantity });
		await basket.reload();
	}
	return basket;
  }

  public async decrement(basketId, productId, quantity): Promise<BasketModel> {
	let basket = await this.basketModel.findByPk(basketId, {
		include: { model: ProductModel, as: 'products' },
	});
	if (!basket) {
		basket = await this.basketModel.create();
	}

	const basket_product = await this.basketProductModel.findOne({
		where: { basketId, productId },
	});
	// Если продукт в корзине не найден удаляем его из таблицы BasketProductModel
	if (!basket_product) {
		await basket_product.destroy();
	}
	// если количество продуктов в корзине больше переданного количества,
	// то уменьшаем количество товаров в корзине
	if (basket_product.quantity > quantity) {
		await basket_product.decrement('quantity', { by: quantity });
	}
	// Обновляю объект корзины, что бы подтянуть обновленные данные
	await basket.reload();
	return basket;
  }

  public async removeFromBasket(
	basketId: number,
	productId: number,
  ): Promise<BasketModel> {
	const basket = await this.basketModel.findByPk(basketId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!basket) {
		await this.basketModel.create();
	}
	const basket_product = await this.basketProductModel.findOne({
		where: { basketId, productId },
	});
	if (basket_product) {
		await basket_product.destroy();
		await basket.reload();
	}
	return basket;
  }

  public async clearBasket(basketId: number): Promise<BasketModel> {
	let basket = await this.basketModel.findByPk(basketId, {
		include: [{ model: ProductModel, as: 'products' }],
	});
	if (!basket) {
		basket = await this.basketModel.create();
	}
	await this.basketProductModel.destroy({ where: { basketId } });
	await basket.reload();
	return basket;
  }
}
