import {
    CreateProductDto,
    SearchDto,
    SortingDto,
} from '@app/infrastructure/dto';
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

export interface IProductController {
    create(
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

    update(
        id: number,
        dto: CreateProductDto,
        image: Express.Multer.File,
    ): Promise<UpdateProductResponse>;

    removeProduct(id: number): Promise<RemoveProductResponse>;
}
