import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductModel } from './product.model';
import { CreateProductDto } from './dto/create-product.dto';
import { FileService } from '../file/file.service';
import { ProductRepository } from './product.repository';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginateProductDto } from './dto/paginate-product.dto';
import { IProductsResponse } from './product.controller';

export interface IGetMetadata {
  totalCount: number;
  lastPage: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
}

@Injectable()
export class ProductService {
  constructor(
	private readonly productRepository: ProductRepository,
	private readonly fileService: FileService,
  ) {}

  public async productCreate(
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	const imageName = await this.fileService.createFile(image);
	return this.productRepository.create(dto, imageName);
  }

  public async getProduct(id: number): Promise<ProductModel> {
	const product = await this.productRepository.findProduct(id);
	if (!product) {
		this.notFound('К сожалению по вашему запросу ничего не найдено');
	}
	return product;
  }

  public async findAllProducts(
	action: QueryProductDto,
	paginate: PaginateProductDto,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(paginate);
	const products = await this.productRepository.findAllProducts(
		action,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, paginate, limit);
	if (!products.rows.length) {
		this.notFound('По вашему запросу ничего не найдено');
	}
	return {
		metaData,
		rows: products.rows,
	};
  }

  public async findAllByBrandId(
	brandId: number,
	action: QueryProductDto,
	paginate: PaginateProductDto,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(paginate);
	const products = await this.productRepository.findAllByBrandId(
		brandId,
		action,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, paginate, limit);
	if (!products.rows.length) {
		this.notFound('По вашему запросу ничего не найдено');
	}
	return {
		metaData,
		rows: products.rows,
	};
  }

  public async findAllByCategoryId(
	categoryId: number,
	action: QueryProductDto,
	paginate: PaginateProductDto,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(paginate);
	const products = await this.productRepository.findAllByCategoryId(
		categoryId,
		action,
		limit,
		offset,
	);

	const metaData = this.getMetadata(products.count, paginate, limit);
	if (!products.rows.length) {
		this.notFound('По вашему запросу ничего не найдено');
	}
	return {
		metaData,
		rows: products.rows,
	};
  }

  public async findAllByBrandIdAndCategoryId(
	brandId: number,
	categoryId: number,
	action: QueryProductDto,
	paginate: PaginateProductDto,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(paginate);
	const products = await this.productRepository.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		action,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, paginate, limit);
	if (!products.rows.length) {
		this.notFound('По вашему запросу ничего не найдено');
	}
	return {
		metaData,
		rows: products.rows,
	};
  }

  public async removeProduct(id: number): Promise<boolean> {
	const findProduct = await this.productRepository.findProduct(id);
	if (!findProduct) {
		this.notFoundId(id);
	}
	const removedFile = await this.fileService.removeFile(findProduct.image);
	const removedProduct = await this.productRepository.removedProduct(id);
	if (!removedFile || !removedProduct) {
		this.conflict('Произошел конфликт во время удаления продукта');
	}
	return true;
  }

  public async updateProduct(
	id: number,
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	const findProduct = await this.productRepository.findProduct(id);
	if (!findProduct) {
		this.notFoundId(id);
	}
	const updatedNameImage = await this.fileService.updateFile(
		findProduct.image,
		image,
	);
	if (!updatedNameImage) {
		this.conflict('При обновлении картинки произошел конфликт');
	}
	const updatedProduct = await this.productRepository.updateProduct(
		dto,
		findProduct,
		updatedNameImage,
	);
	if (!updatedProduct) {
		this.conflict('При обновлении продукта произошел конфликт');
	}
	return updatedProduct;
  }

  private getPaginate(paginate: PaginateProductDto): {
	limit: number;
	offset: number;
  } {
	const { page, size } = paginate;
	const limit = size;
	const offset = (page - 1) * limit;
	return { limit, offset };
  }

  private getMetadata(
	count: number,
	paginate: PaginateProductDto,
	limit: number,
  ): IGetMetadata {
	return {
		totalCount: count,
		lastPage: Math.ceil(count / limit),
		currentPage: paginate.page,
		nextPage: paginate.page + 1,
		previousPage: paginate.page - 1,
	};
  }

  private conflict(message: string): void {
	throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message,
	});
  }

  private notFoundId(id: number): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: `Продукт с идентификатором ${id} не найден в базе данных`,
	});
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
