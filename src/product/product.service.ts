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
import { IProductsResponse } from './product.controller';
import { SearchQueryDto } from './dto/search-query.dto';
import { SortQueryDto, Sort } from './dto/sort-query.dto';

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

  public async getListAllProducts(
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<IProductsResponse> {
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const { limit, offset } = this.getPaginate(page, size);
	const products = await this.productRepository.findListAllProducts(
		search,
		sort,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, page, limit);
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
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(page, size);
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const products = await this.productRepository.findAllByBrandId(
		brandId,
		search,
		sort,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, page, limit);
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
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(page, size);
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const products = await this.productRepository.findAllByCategoryId(
		categoryId,
		search,
		sort,
		limit,
		offset,
	);

	const metaData = this.getMetadata(products.count, page, limit);
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
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<IProductsResponse> {
	const { limit, offset } = this.getPaginate(page, size);
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const products = await this.productRepository.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		search,
		sort,
		limit,
		offset,
	);
	const metaData = this.getMetadata(products.count, page, limit);
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

  private getPaginate(
	page: number,
	size: number,
  ): {
	limit: number;
	offset: number;
  } {
	const limit = size;
	const offset = (page - 1) * limit;
	return { limit, offset };
  }

  private getMetadata(
	count: number,
	page: number,
	limit: number,
  ): IGetMetadata {
	return {
		totalCount: count,
		lastPage: Math.ceil(count / limit),
		currentPage: page,
		nextPage: page + 1,
		previousPage: page - 1,
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
