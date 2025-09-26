import { MetaData, ProductInfo } from '@app/infrastructure/paginate';


export interface IPaginatedResponse<T> {
    data: T[];
    meta: MetaData;
}


export interface IGetListProductV2Response extends IPaginatedResponse<ProductInfo> {
    data: ProductInfo[];
    meta: MetaData;
}