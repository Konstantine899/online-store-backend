import { Rows, MetaData } from '@app/infrastructure/paginate';

export interface IGetListProductResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
