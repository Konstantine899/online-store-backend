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

interface IFindAllProductsResponse {
  count: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
  lastPage: number;
  rows: ProductModel[];
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

  public async findOneProduct(id: number): Promise<ProductModel> {
    const product = await this.productRepository.findOneProduct(id);
    if (!product) {
      this.notFound('К сожалению по вашему запросу ничего не найдено');
    }
    return product;
  }

  public async findAllProducts(
    action: QueryProductDto,
    paginate: PaginateProductDto,
  ): Promise<IFindAllProductsResponse> {
    const { limit, offset } = this.getPaginate(paginate);
    const products = await this.productRepository.findAllProducts(
      action,
      limit,
      offset,
    );
    const lastPage = Math.ceil(products.count / limit);
    const currentPage = paginate.page;
    const nextPage = paginate.page + 1;
    const previousPage = paginate.page - 1;
    if (!products.rows.length) {
      this.notFound('По вашему запросу ничего не найдено');
    }
    return {
      count: products.count,
      currentPage,
      nextPage,
      previousPage,
      lastPage,
      rows: products.rows,
    };
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

  public async findAllByBrandId(brandId: number): Promise<ProductModel[]> {
    const allProductsByBrand = await this.productRepository.findAllByBrandId(
      brandId,
    );
    if (!allProductsByBrand.length) {
      this.notFound('К сожалению по вашему запросу ничего не найдено');
    }
    return allProductsByBrand;
  }

  public async findAllByCategoryId(
    categoryId: number,
  ): Promise<ProductModel[]> {
    const allProductsByCategoryId =
      await this.productRepository.findAllByCategoryId(categoryId);
    if (!allProductsByCategoryId.length) {
      this.notFound('К сожалению по вашему запросу ничего не найдено');
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
      this.notFound('К сожалению по вашему запросу ничего не найдено');
    }
    return allProductsByBrandIdAndCategoryId;
  }

  public async removeProduct(id: number): Promise<boolean> {
    const findProduct = await this.productRepository.findOneProduct(id);
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
    const findProduct = await this.productRepository.findOneProduct(id);
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
