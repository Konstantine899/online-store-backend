import { MetaData } from '../../../infrastructure/paginate/meta-data';
import { Rows } from '../../../infrastructure/paginate/rows';

export interface IGetListProductByCategoryIdResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
