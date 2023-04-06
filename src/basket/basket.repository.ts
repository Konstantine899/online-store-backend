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
}
