import {
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
import { FileService } from '../file/file.service';
import {
    ProductPropertyRepository,
    ProductRepository,
} from '@app/infrastructure/repositories';
import {
    CreateProductResponse,
    GetProductResponse,
    GetListProductResponse,
    GetListProductByBrandIdResponse,
    GetListProductByCategoryIdResponse,
    GetAllByBrandIdAndCategoryIdResponse,
    UpdateProductResponse,
    RemoveProductResponse,
} from '@app/infrastructure/responses';
import { MetaData } from '@app/infrastructure/paginate';
import { SortingEnum } from '@app/domain/dto';
import { IProductService } from '@app/domain/services';
import { RatingService } from '@app/infrastructure/services';

@Injectable()
export class ProductService implements IProductService {
    constructor(
        private readonly productPropertyRepository: ProductPropertyRepository,
        private readonly productRepository: ProductRepository,
        private readonly ratingService: RatingService,
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
        const product = await this.productRepository.findProductProperty(id);
        if (!product) {
            this.notFound('Продукт не найден');
        }
        return product;
    }

    public async getListProduct(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductResponse> {
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const { limit, offset } = this.getPaginate(page, size);
        const products = await this.productRepository.findListProduct(
            search,
            sort,
            limit,
            offset,
        );
        const metaData = this.getMetadata(products.count, page, limit);
        return {
            metaData,
            count: products.count,
            rows: products.rows,
        };
    }

    public async getListProductByBrandId(
        brandId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByBrandIdResponse> {
        const { limit, offset } = this.getPaginate(page, size);
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const products = await this.productRepository.findListProductByBrandId(
            brandId,
            search,
            sort,
            limit,
            offset,
        );
        const metaData = this.getMetadata(products.count, page, limit);

        return {
            metaData,
            count: products.count,
            rows: products.rows,
        };
    }

    public async getListProductByCategoryId(
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByCategoryIdResponse> {
        const { limit, offset } = this.getPaginate(page, size);
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const products =
            await this.productRepository.findListProductByCategoryId(
                categoryId,
                search,
                sort,
                limit,
                offset,
            );

        const metaData = this.getMetadata(products.count, page, limit);

        return {
            metaData,
            count: products.count,
            rows: products.rows,
        };
    }

    public async getAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse> {
        const { limit, offset } = this.getPaginate(page, size);
        const { search } = searchQuery;
        const { sort = SortingEnum.DESC } = sortQuery;
        const products =
            await this.productRepository.findAllByBrandIdAndCategoryId(
                brandId,
                categoryId,
                search,
                sort,
                limit,
                offset,
            );
        const metaData = this.getMetadata(products.count, page, limit);
        return {
            metaData,
            count: products.count,
            rows: products.rows,
        };
    }

    public async removeProduct(
        productId: number,
    ): Promise<RemoveProductResponse> {
        const findProduct =
            await this.productRepository.findProductProperty(productId);
        if (!findProduct) {
            this.notFound('Продукт не найден в БД');
        }
        const removedFile = await this.fileService.removeFile(
            findProduct.image,
        );
        const removedRating =
            await this.ratingService.removeAllRatingsByProductId(productId);
        const removedProductProperties =
            await this.productPropertyRepository.removeProductPropertiesListByProductId(
                productId,
            );

        const removedProduct =
            await this.productRepository.removedProduct(productId);
        if (!removedFile) {
            this.conflict('Произошел конфликт во время удаления файла');
            if (!removedProductProperties) {
                this.conflict(
                    'Произошел конфликт во время удаления характеристик продукта',
                );
            }
            if (!removedRating) {
                this.conflict(
                    'Произошел конфликт во время удаления рейтинга продукта',
                );
            }
        }
        if (!removedProduct) {
            this.conflict('Произошел конфликт во время удаления продукта');
        }
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async updateProduct(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse> {
        const findProduct =
            await this.productRepository.findProductProperty(id);
        if (!findProduct) {
            this.notFound('Продукт не найден в БД');
        }
        const updatedNameImage = await this.fileService.updateFile(
            findProduct.image,
            image,
        );
        return this.productRepository.updateProduct(
            dto,
            findProduct,
            updatedNameImage,
        );
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
        return {
            limit,
            offset,
        };
    }

    private getMetadata(count: number, page: number, limit: number): MetaData {
        return {
            totalCount: count,
            lastPage: Math.ceil(count / limit),
            currentPage: page,
            nextPage: page + 1,
            previousPage: page - 1,
            limit,
        };
    }

    private conflict(message: string): void {
        throw new ConflictException({
            status: HttpStatus.CONFLICT,
            message,
        });
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
