import { CreateProductDto } from '../../infrastructure/dto/product/create-product.dto';
import { CreateProductResponse } from '../../infrastructure/responses/product/create-product.response';
import { GetProductResponse } from '../../infrastructure/responses/product/get-product.response';
import { SearchQueryDto } from '../../infrastructure/dto/product/search-query.dto';
import { SortQueryDto } from '../../infrastructure/dto/product/sort-query.dto';
import { GetListProductResponse } from '../../infrastructure/responses/product/get-list-product.response';
import { GetListProductByBrandIdResponse } from '../../infrastructure/responses/product/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from '../../infrastructure/responses/product/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from '../../infrastructure/responses/product/get-all-by-brand-id-and-category-id.response';
import { UpdateProductResponse } from '../../infrastructure/responses/product/update-product.response';
import { RemoveProductResponse } from '../../infrastructure/responses/product/remove-product.response';

export interface IProductController {
    create(
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<CreateProductResponse>;

    getProduct(id: number): Promise<GetProductResponse>;

    getListProduct(
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductResponse>;

    getListProductByBrandId(
        brandId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductByBrandIdResponse>;

    getListProductByCategoryId(
        categoryId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetListProductByCategoryIdResponse>;

    getAllByBrandIdAndCategoryId(
        brandId: number,
        categoryId: number,
        searchQuery: SearchQueryDto,
        sortQuery: SortQueryDto,
        page: number,
        size: number,
    ): Promise<GetAllByBrandIdAndCategoryIdResponse>;

    update(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;
}
