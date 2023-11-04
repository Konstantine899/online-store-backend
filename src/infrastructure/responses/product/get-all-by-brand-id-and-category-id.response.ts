import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from '../../paginate/meta-data';
import { Rows } from '../../paginate/rows';
import { IGetAllByBrandIdAndCategoryIdResponse } from '@app/domain/responses';

export class GetAllByBrandIdAndCategoryIdResponse
    implements IGetAllByBrandIdAndCategoryIdResponse
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
