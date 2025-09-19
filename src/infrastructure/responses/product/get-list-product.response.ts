import { ApiProperty } from '@nestjs/swagger';
import { ProductInfo, MetaData } from '@app/infrastructure/paginate';
import { IGetListProductResponse } from '@app/domain/responses';

export class GetListProductResponse implements IGetListProductResponse {
    @ApiProperty()
    declare metaData: MetaData;

    @ApiProperty({
        example: 1,
        description: 'Количество найденных элементов',
    })
    declare count: number;

    @ApiProperty({ type: () => [ProductInfo] })
    declare rows: ProductInfo[];
}
