import { CreateProductDto } from '../../../infrastructure/dto/product/create-product.dto';
import { CreateProductResponse } from '../../../infrastructure/responses/product/create-product.response';
import { GetProductResponse } from '../../../infrastructure/responses/product/get-product.response';
import { SearchDto } from '../../../infrastructure/dto/product/search-dto';
import { SortingDto } from '../../../infrastructure/dto/product/sorting-dto';
import { GetListProductResponse } from '../../../infrastructure/responses/product/get-list-product.response';
import { GetListProductByBrandIdResponse } from '../../../infrastructure/responses/product/get-list-product-by-brand-id.response';
import { GetListProductByCategoryIdResponse } from '../../../infrastructure/responses/product/get-list-product-by-category-id.response';
import { GetAllByBrandIdAndCategoryIdResponse } from '../../../infrastructure/responses/product/get-all-by-brand-id-and-category-id.response';
import { RemoveProductResponse } from '../../../infrastructure/responses/product/remove-product.response';
import { UpdateProductResponse } from '../../../infrastructure/responses/product/update-product.response';

export interface IProductService {
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
