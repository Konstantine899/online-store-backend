import { ApiProperty } from '@nestjs/swagger';
import { BrandInfo, MetaData } from '@app/infrastructure/paginate';

export class GetListBrandsV2Response {
    @ApiProperty({
        description: 'Список брендов',
        type: [BrandInfo],
        example: [
            {
                id: 1,
                name: 'Apple',
                slug: 'apple',
                description: 'Американский производитель электроники',
                isActive: true,
                logo: 'apple-logo.png',
                category_id: 1,
                tenant_id: 1,
            },
        ],
    })
    declare data: BrandInfo[];

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

