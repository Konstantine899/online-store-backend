import { MetaData } from '../../../infrastructure/paginate/meta-data';
import { Rows } from '../../../infrastructure/paginate/rows';

export interface IGetListProductResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
