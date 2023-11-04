import { CreateProductDto } from '../../../infrastructure/dto/product/create-product.dto';
import { CreateProductResponse } from '../../../infrastructure/responses/product/create-product.response';
import { ProductModel } from '@app/domain/models';
import { GetProductResponse } from '../../../infrastructure/responses/product/get-product.response';
import { Rows } from '@app/infrastructure/paginate';
import { UpdateProductResponse } from '../../../infrastructure/responses/product/update-product.response';

export interface IProductRepository {
    create(
        dto: CreateProductDto,
        imageName: string,
    ): Promise<CreateProductResponse>;

    fidProductByPkId(productId: number): Promise<ProductModel>;

    findProduct(id: number): Promise<GetProductResponse>;

    findListProduct(
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: Rows[] }>;

    findListProductByBrandId(
        brandId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: Rows[] }>;

    findListProductByCategoryId(
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: Rows[] }>;

    findAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        search: string,
        sort: string,
        limit: number,
        offset: number,
    ): Promise<{ count: number; rows: Rows[] }>;

    removedProduct(id: number): Promise<number>;

    updateProduct(
        dto: CreateProductDto,
        findProduct: ProductModel,
        updatedNameImage: string,
    ): Promise<UpdateProductResponse>;
}
