import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from './paginate/meta-data';
import { Rows } from './paginate/rows';

export class GetListProductByBrandIdResponse {
    @ApiProperty()
    metaData: MetaData;

    @ApiProperty({ example: 1, description: 'Количество найденных элементов' })
    count: number;

    @ApiProperty({ type: () => [Rows] })
    rows: Rows[];
}
