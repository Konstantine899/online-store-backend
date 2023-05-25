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
import { SearchQueryDto } from './dto/search-query.dto';
import { Sort, SortQueryDto } from './dto/sort-query.dto';
import { CreateProductResponse } from './responses/create-product.response';
import { GetProductResponse } from './responses/get-product.response';
import { GetListProductResponse } from './responses/get-list-product.response';
import { MetaData } from './responses/paginate/meta-data';
import { GetListProductByBrandIdResponse } from './responses/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from './responses/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from './responses/get-all-by-brand-id-and-category-id.response';

@Injectable()
export class ProductService {
  constructor(
	private readonly productRepository: ProductRepository,
	private readonly fileService: FileService,
  ) {}

  public async productCreate(
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<CreateProductResponse> {
	const imageName = await this.fileService.createFile(image);
	return this.productRepository.create(dto, imageName);
  }

  public async getProduct(id: number): Promise<GetProductResponse> {
	const product = await this.productRepository.findProduct(id);
	if (!product) {
		this.notFound('К сожалению по вашему запросу ничего не найдено');
	}
	return product;
  }

  public async getListProduct(
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<GetListProductResponse> {
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const { limit, offset } = this.getPaginate(page, size);
	const products = await this.productRepository.findListProduct(
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

  public async getListProductByBrandId(
	brandId: number,
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<GetListProductByBrandIdResponse> {
	const { limit, offset } = this.getPaginate(page, size);
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const products = await this.productRepository.findListProductByBrandId(
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

  public async getListProductByCategoryId(
	categoryId: number,
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<GetListProductByCategoryIdResponse> {
	const { limit, offset } = this.getPaginate(page, size);
	const { search } = searchQuery;
	const { sort = Sort.DESC } = sortQuery;
	const products = await this.productRepository.findListProductByCategoryId(
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

  public async getAllByBrandIdAndCategoryId(
	brandId: number,
	categoryId: number,
	searchQuery: SearchQueryDto,
	sortQuery: SortQueryDto,
	page: number,
	size: number,
  ): Promise<GetAllByBrandIdAndCategoryIdResponse> {
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

  public async removeProduct(id: number): Promise<number> {
	const findProduct = await this.productRepository.findProduct(id);
	if (!findProduct) {
		this.notFoundId(id);
	}
	const removedFile = await this.fileService.removeFile(findProduct.image);
	const removedProduct = await this.productRepository.removedProduct(id);
	if (!removedFile || !removedProduct) {
		this.conflict('Произошел конфликт во время удаления продукта');
	}
	return removedProduct;
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

  private getMetadata(count: number, page: number, limit: number): MetaData {
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
