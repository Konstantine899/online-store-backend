import { Rows, MetaData } from '@app/infrastructure/paginate';

export interface IGetAllByBrandIdAndCategoryIdResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
