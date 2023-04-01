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

  public async findOneProduct(id: number): Promise<ProductModel> {
	const product = await this.productRepository.findOneProduct(id);
	if (!product) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	return product;
  }

  public async findAllProducts(
	search?: string,
	sort?: string,
  ): Promise<ProductModel[]> {
	if (search && sort) {
		return this.searchAndSort(search, sort);
	}
	if (search) {
		return this.search(search);
	}
	if (sort) {
		return this.sort(sort);
	}
	if (!search && sort) {
		return this.findAll();
	}
  }

  public async findAllByBrandId(
	brandId: number,
	sort?: string,
  ): Promise<ProductModel[]> {
	if (sort) {
		return this.productRepository.findAllByBrandIdAndSortByPrice(
		brandId,
		sort,
		);
	}
	const allProductsByBrand = await this.productRepository.findAllByBrandId(
		brandId,
	);
	if (!allProductsByBrand) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукты не найдены',
		});
	}
	return allProductsByBrand;
  }

  public async findAllByCategoryId(
	categoryId: number,
  ): Promise<ProductModel[]> {
	const allProductsByCategoryId =
		await this.productRepository.findAllByCategoryId(categoryId);

	if (!allProductsByCategoryId) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукты не найдены',
		});
	}
	return allProductsByCategoryId;
  }

  public async findAllByBrandIdAndCategoryId(
	brandId: number,
	categoryId: number,
  ): Promise<ProductModel[]> {
	const allProductsByBrandIdAndCategoryId =
		await this.productRepository.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		);
	if (!allProductsByBrandIdAndCategoryId) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукты не найдены',
		});
	}
	return allProductsByBrandIdAndCategoryId;
  }

  public async removeProduct(id: number): Promise<boolean> {
	const findProduct = await this.productRepository.findOneProduct(id);
	if (!findProduct) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	const removedFile = await this.fileService.removeFile(findProduct.image);
	const removedProduct = await this.productRepository.removedProduct(id);
	if (!removedFile || !removedProduct) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'Произошел конфликт во время удаления продукта',
		});
	}
	return true;
  }

  public async updateProduct(
	id: number,
	dto: CreateProductDto,
	image: Express.Multer.File,
  ): Promise<ProductModel> {
	const findProduct = await this.productRepository.findOneProduct(id);
	if (!findProduct) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукт не найден',
		});
	}
	const updatedNameImage = await this.fileService.updateFile(
		findProduct.image,
		image,
	);
	const updatedProduct = await this.productRepository.updateProduct(
		dto,
		findProduct,
		updatedNameImage,
	);
	if (!updatedProduct) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: 'При обновлении продукта произошел конфликт',
		});
	}
	return updatedProduct;
  }

  private async searchAndSort(
	search: string,
	sort: string,
  ): Promise<ProductModel[]> {
	const foundProducts = await this.productRepository.searchAndSort(
		search,
		sort,
	);
	if (!foundProducts) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: `По вашему запросу ничего не найдено`,
		});
	}
	return foundProducts;
  }

  private async search(search: string): Promise<ProductModel[]> {
	const foundProducts = await this.productRepository.search(search);
	if (!foundProducts) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: `По вашему запросу ничего не найдено`,
		});
	}
	return foundProducts;
  }

  private async sort(sort: string): Promise<ProductModel[]> {
	return this.productRepository.sort(sort);
  }

  private async findAll(): Promise<ProductModel[]> {
	const products = await this.productRepository.findAllProducts();
	if (!products) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'Продукты не найдены',
		});
	}
	return products;
  }
}
