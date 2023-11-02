import { MetaData } from '../../../infrastructure/paginate/meta-data';
import { Rows } from '../../../infrastructure/paginate/rows';

export interface IGetAllByBrandIdAndCategoryIdResponse {
    metaData: MetaData;
    count: number;
    rows: Rows[];
}
