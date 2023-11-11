import { ProductInfo, MetaData } from '@app/infrastructure/paginate';

export interface IGetListProductByCategoryIdResponse {
    metaData: MetaData;
    count: number;
    rows: ProductInfo[];
}
