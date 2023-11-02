import {
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { FileService } from '../file/file.service';
import { ProductRepository } from '../../repositories/product/product.repository';
import { SearchDto } from '../../dto/product/search-dto';
import { SortingDto } from '../../dto/product/sorting-dto';
import { CreateProductResponse } from '../../responses/product/create-product.response';
import { GetProductResponse } from '../../responses/product/get-product.response';
import { GetListProductResponse } from '../../responses/product/get-list-product.response';
import { MetaData } from '../../paginate/meta-data';
import { GetListProductByBrandIdResponse } from '../../responses/product/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from '../../responses/product/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from '../../responses/product/get-all-by-brand-id-and-category-id.response';
import { UpdateProductResponse } from '../../responses/product/update-product.response';
import { RemoveProductResponse } from '../../responses/product/remove-product.response';
import { SortingEnum } from '../../../domain/dto/product/i-sorting-dto';

interface IProductService {
    productCreate(
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<CreateProductResponse>;

    getProduct(id: number): Promise<GetProductResponse>;

    getListProduct(
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductResponse>;

    getListProductByBrandId(
        brandId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByBrandIdResponse>;

    getListProductByCategoryId(
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetListProductByCategoryIdResponse>;

    getAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        searchQuery: SearchDto,
        sortQuery: SortingDto,
        page: number,
        size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;

    updateProduct(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;
}

@Injectable()
export class ProductService implements IProductService {
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
        if (!products.rows.length) {
            this.notFound('По вашему запросу ничего не найдено');
        }
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
        if (!products.rows.length) {
            this.notFound('По вашему запросу ничего не найдено');
        }
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
        if (!products.rows.length) {
            this.notFound('По вашему запросу ничего не найдено');
        }
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
        if (!products.rows.length) {
            this.notFound('По вашему запросу ничего не найдено');
        }
        return {
            metaData,
            count: products.count,
            rows: products.rows,
        };
    }

    public async removeProduct(id: number): Promise<RemoveProductResponse> {
        const findProduct = await this.productRepository.findProduct(id);
        if (!findProduct) {
            this.notFound('Продукт не найден в БД');
        }
        const removedFile = await this.fileService.removeFile(
            findProduct.image,
        );
        const removedProduct = await this.productRepository.removedProduct(id);
        if (!removedFile || !removedProduct) {
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
        const findProduct = await this.productRepository.findProduct(id);
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