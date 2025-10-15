import { ApiProperty } from '@nestjs/swagger';
import { CategoryInfo, MetaData } from '@app/infrastructure/paginate';

export class GetListCategoriesV2Response {
    @ApiProperty({
        description: 'Список категорий',
        type: [CategoryInfo],
        example: [
            {
                id: 1,
                name: 'Смартфоны',
                image: 'smartphones.jpg',
                slug: 'smartfony',
                description: 'Категория мобильных устройств',
                isActive: true,
                tenant_id: 1,
            },
        ],
    })
    declare data: CategoryInfo[];

    @ApiProperty({
        description: 'Метаданные пагинации',
        type: MetaData,
        example: {
            totalCount: 10,
            lastPage: 2,
            currentPage: 1,
            nextPage: 2,
            previousPage: null,
            limit: 5,
        },
    })
    declare meta: MetaData;
}

