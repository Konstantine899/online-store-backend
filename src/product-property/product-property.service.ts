import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductPropertyDto } from './dto/create-product-property.dto';
import { ProductPropertyModel } from './product-property.model';
import { ProductPropertyRepository } from './product-property.repository';
import { ProductRepository } from '../product/product.repository';
import { ProductModel } from '../product/product.model';

@Injectable()
export class ProductPropertyService {
  constructor(
	private readonly propertyProductRepository: ProductPropertyRepository,
	private readonly productRepository: ProductRepository,
  ) {}

  public async create(
	productId: number,
	dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	await this.findProduct(productId);
	return this.propertyProductRepository.create(productId, dto);
  }

  public async findOneProductProperty(
	productId: number,
	id: number,
  ): Promise<ProductPropertyModel> {
	await this.findProduct(productId);
	const property =
		await this.propertyProductRepository.findOneProductProperty(
		productId,
		id,
		);
	if (!property) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт или свойство продукта не найдено',
		});
	}
	return property;
  }

  public async findAllProductProperties(
	productId: number,
  ): Promise<ProductPropertyModel[]> {
	await this.findProduct(productId);
	const properties =
		await this.propertyProductRepository.findAllProductProperties(productId);

	if (!properties.length) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Свойства продукта не найдены',
		});
	}
	return properties;
  }

  public async updateProductProperty(
	productId: number,
	id: number,
	dto: CreateProductPropertyDto,
  ): Promise<ProductPropertyModel> {
	await this.findProduct(productId);
	const property = await this.findOneProductProperty(productId, id);
	const updatedProductProperty =
		await this.propertyProductRepository.updateProductProperty(property, dto);
	if (!updatedProductProperty) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При обновлении свойства продукта произошла ошибка',
		});
	}
	return updatedProductProperty;
  }

  public async removeProductProperty(
	productId: number,
	id: number,
  ): Promise<boolean> {
	await this.findOneProductProperty(productId, id);
	const removedPropertyId =
		await this.propertyProductRepository.removeProductProperty(id);
	if (!removedPropertyId) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При удалении свойства продукта произошел конфликт',
		});
	}
	return true;
  }

  private async findProduct(productId: number): Promise<ProductModel> {
	const findProduct = await this.productRepository.findOneProduct(productId);
	if (!findProduct) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	return findProduct;
  }
}
