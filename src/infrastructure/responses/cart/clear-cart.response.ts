import { ICartTransformData } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '@app/domain/models';

export class ClearCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    declare readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Пустая корзина',
    })
    declare readonly products: ProductModel[];
}
