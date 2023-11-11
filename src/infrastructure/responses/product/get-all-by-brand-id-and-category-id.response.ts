import { ApiProperty } from '@nestjs/swagger';
import { ProductInfo, MetaData } from '@app/infrastructure/paginate';
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

    @ApiProperty({ type: () => [ProductInfo] })
    rows: ProductInfo[];
}
