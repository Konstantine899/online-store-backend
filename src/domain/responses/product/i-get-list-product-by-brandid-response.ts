import { Rows, MetaData } from '@app/infrastructure/paginate';

export interface IGetListProductByBrandIdResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
