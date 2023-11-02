import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from '../../paginate/meta-data';
import { Rows } from '../../paginate/rows';
import { IGetAllByBrandIdAndCategoryIdResponse } from '../../../domain/responses/product/i-get-all-by-brandid-and-categoryid-response';

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
