import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductPropertyDto } from './dto/create-product-property.dto';
import { ProductPropertyModel } from './product-property.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ProductPropertyService {
  constructor(
	@InjectModel(ProductPropertyModel)
	private productPropertyRepository: typeof ProductPropertyModel,
  ) {}

  public async create(
	productId: number,
	dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	if (!productId) {
		throw new BadRequestException('Не указан id продукта');
	}

	const property = await this.productPropertyRepository.create({
		productId,
		...dto,
	});

	if (!property) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return property;
  }

  public async findOne(
	productId: number,
	id: number,
  ): Promise<ProductPropertyModel> {
	if (!productId || !id) {
		throw new BadRequestException(
		'Не указан id продукта или id свойства товара',
		);
	}
	const property = await this.productPropertyRepository.findOne({
		where: { productId, id },
	});
	if (!property) {
		throw new NotFoundException('Не найдено');
	}
	return property;
  }

  public async findAll(productId: number): Promise<ProductPropertyModel[]> {
	if (!productId) {
		throw new BadRequestException('Не указан id продукта');
	}
	const properties = await this.productPropertyRepository.findAll({
		where: { productId },
	});

	if (!properties.length) {
		throw new NotFoundException('Не найдено');
	}
	return properties;
  }

  public async update(
	productId: number,
	id: number,
	dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	const property = await this.findOne(productId, id);
	if (!dto) {
		throw new BadRequestException('Нет данных для обновления');
	}
	const updateProperty = await property.update({
		...dto,
		name: dto.name,
		value: dto.value,
	});
	if (!updateProperty) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return updateProperty;
  }

  public async remove(productId: number, id: number): Promise<boolean> {
	await this.findOne(productId, id);
	const removedProperty = await this.productPropertyRepository.destroy({
		where: { id },
	});
	if (!removedProperty) {
		throw new HttpException(
		'Внутренняя ошибка сервера',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	return true;
  }
}
