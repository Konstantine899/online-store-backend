import { ApiProperty } from '@nestjs/swagger';
import { Rows, MetaData } from '@app/infrastructure/paginate';
import { IGetListProductResponse } from '@app/domain/responses';

export class GetListProductResponse implements IGetListProductResponse {
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
