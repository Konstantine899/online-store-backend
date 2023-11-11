import { ApiProperty } from '@nestjs/swagger';
import { ProductInfo, MetaData } from '@app/infrastructure/paginate';
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

    @ApiProperty({ type: () => [ProductInfo] })
    rows: ProductInfo[];
}
