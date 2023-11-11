import { CreateProductDto } from '@app/infrastructure/dto';
import {
    CreateProductResponse,
    GetProductResponse,
    UpdateProductResponse,
} from '@app/infrastructure/responses';
import { ProductModel } from '@app/domain/models';
import { ProductInfo } from '@app/infrastructure/paginate';

export interface IProductRepository {
    create(
        dto: CreateProductDto,
        imageName: string,
    ): Promise<CreateProductResponse>;

    fidProductByPkId(productId: number): Promise<ProductModel>;

    findProductProperty(id: number): Promise<GetProductResponse>;

    findListProduct(
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }>;

    findListProductByBrandId(
        brandId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }>;

    findListProductByCategoryId(
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }>;

    findAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: ProductInfo[] }>;

    removedProduct(id: number): Promise<number>;

    updateProduct(
        dto: CreateProductDto,
        findProduct: ProductModel,
        updatedNameImage: string,
    ): Promise<UpdateProductResponse>;
}
