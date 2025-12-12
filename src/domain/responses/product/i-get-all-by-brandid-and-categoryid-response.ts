import type { ProductInfo, MetaData } from '@app/infrastructure/paginate';

export interface IGetAllByBrandIdAndCategoryIdResponse {
    metaData: MetaData;
    count: number;
    rows: ProductInfo[];
}
