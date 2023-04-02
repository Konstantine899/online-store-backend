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
		this.notFound();
	}
	return product;
  }

  public async findAllProducts(
	search?: string,
	sort?: string,
  ): Promise<ProductModel[]> {
	if (search && sort) {
		const foundProducts = await this.productRepository.searchAndSort(
		search,
		sort,
		);
		if (!foundProducts.length) {
		this.notFound();
		}
		return foundProducts;
	}
	if (search) {
		const foundProducts = await this.productRepository.search(search);
		if (!foundProducts.length) {
		this.notFound();
		}
		return foundProducts;
	}
	if (sort) {
		return this.productRepository.sort(sort);
	}
	if (!search && sort) {
		const products = await this.productRepository.findAllProducts();
		if (!products.length) {
		this.notFound();
		}
		return products;
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
	if (!allProductsByBrand.length) {
		this.notFound();
	}
	return allProductsByBrand;
  }

  public async findAllByCategoryId(
	categoryId: number,
  ): Promise<ProductModel[]> {
	const allProductsByCategoryId =
		await this.productRepository.findAllByCategoryId(categoryId);
	if (!allProductsByCategoryId.length) {
		this.notFound();
	}
	return allProductsByCategoryId;
  }

  public async findAllByBrandIdAndCategoryId(
	brandId: number,
	categoryId: number,
	sort?: string,
  ): Promise<ProductModel[]> {
	if (sort) {
		return this.productRepository.findAllByBrandIdAndCategoryIdAndSort(
		brandId,
		categoryId,
		sort,
		);
	}
	const allProductsByBrandIdAndCategoryId =
		await this.productRepository.findAllByBrandIdAndCategoryId(
		brandId,
		categoryId,
		);
	if (!allProductsByBrandIdAndCategoryId.length) {
		this.notFound();
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

  private notFound(): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: 'К сожалению по вашему запросу ничего не найдено',
	});
  }
}
