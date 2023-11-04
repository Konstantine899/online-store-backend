import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from '../../paginate/meta-data';
import { Rows } from '../../paginate/rows';
import { IGetListProductByBrandIdResponse } from '@app/domain/responses';

export class GetListProductByBrandIdResponse
    implements IGetListProductByBrandIdResponse
{
    @ApiProperty()
    metaData: MetaData;

    @ApiProperty({
        example: 1,
        description: 'Количество найденных элементов',
    })
    count: number;

    @ApiProperty({ type: () => [Rows] })
    rows: Rows[];
}
