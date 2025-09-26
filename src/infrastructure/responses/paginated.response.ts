import { ApiProperty } from '@nestjs/swagger';
import { MetaData } from '@app/infrastructure/paginate';
import { IPaginatedResponse } from '@app/domain/responses';


export class PaginatedResponse<T> implements IPaginatedResponse<T> {
    @ApiProperty({
        description: 'Массив данных',
        type: 'array',
        items: {},
    })
    declare data: T[];

    @ApiProperty({
        description: 'Метаданные пагинации',
        type: MetaData,
    })
    declare meta: MetaData;

    constructor(data: T[], meta: MetaData) {
        this.data = data;
        this.meta = meta;
    }
}