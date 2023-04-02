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
	const product = await this.findProduct(productId);
	const property = await this.findProperty(productId, id);

	if (!product || !property) {
		this.notFound('Продукт или свойство продукта не найдено');
	}
	return property;
  }

  public async findAllProductProperties(
	productId: number,
  ): Promise<ProductPropertyModel[]> {
	await this.findProduct(productId);
	const properties = await this.findAllProperties(productId);
	if (!properties.length) {
		this.notFound('Свойства продукта не найдены');
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
	const updatedProductProperty = await this.updateProperty(property, dto);
	if (!updatedProductProperty) {
		this.conflict('При обновлении свойства продукта произошла ошибка');
	}
	return updatedProductProperty;
  }

  public async removeProductProperty(
	productId: number,
	id: number,
  ): Promise<boolean> {
	await this.findOneProductProperty(productId, id);
	const removedProperty = await this.removeProperty(id);
	if (!removedProperty) {
		this.conflict('При удалении свойства продукта произошел конфликт');
	}
	return true;
  }

  private async findProduct(productId: number): Promise<ProductModel> {
	return this.productRepository.findOneProduct(productId);
  }

  private async findAllProperties(
	productId: number,
  ): Promise<ProductPropertyModel[]> {
	return this.propertyProductRepository.findAllProductProperties(
		productId,
	);
  }

  private async findProperty(
	productId: number,
	id: number,
  ): Promise<ProductPropertyModel> {
	return this.propertyProductRepository.findOneProductProperty(
		productId,
		id,
	);
  }

  private async updateProperty(
	property: ProductPropertyModel,
	dto: CreateProductPropertyDto,
  ) {
	return this.propertyProductRepository.updateProductProperty(
		property,
		dto,
	);
  }

  private async removeProperty(id: number) {
	return this.propertyProductRepository.removeProductProperty(id);
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }

  private conflict(message: string): void {
	throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message,
	});
  }
}
