import { ApiProperty } from '@nestjs/swagger';
import { ProductInfo, MetaData } from '@app/infrastructure/paginate';
import { IGetListProductV2Response } from '@app/domain/responses';


export class GetListProductV2Response implements IGetListProductV2Response {
    @ApiProperty({
        description: 'Список продуктов',
        type: [ProductInfo],
        example: [
            {
                id: 1,
                name: 'iPhone 15',
                price: 999.99,
                rating: 4.5,
                image: 'iphone15.jpg',
                category_id: 1,
                brand_id: 1,
            }
        ],
    })
    declare data: ProductInfo[];

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