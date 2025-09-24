import { ApiProperty } from '@nestjs/swagger';
import { IMetaData } from '@app/domain/paginate';

export class MetaData implements IMetaData {
    @ApiProperty({
        example: 7,
        description: 'Общее количество продуктов',
    })
    declare totalCount: number;

    @ApiProperty({
        example: 7,
        description: 'Общее количество страниц',
    })
    declare lastPage: number;

    @ApiProperty({
        example: 1,
        description: 'Текущая страница',
    })
    declare currentPage: number;

    @ApiProperty({
        example: 2,
        description: 'Следующая страница',
    })
    declare nextPage: number;

    @ApiProperty({
        example: 0,
        description: 'Предыдущая страница',
    })
    declare previousPage: number;

    @ApiProperty({
        example: 0,
        description: 'Количество элементов на странице',
    })
    declare limit: number;
}
