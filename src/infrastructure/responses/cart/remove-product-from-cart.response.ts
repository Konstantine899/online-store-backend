import { ICartTransformData } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '@app/domain/models';

export class RemoveProductFromCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    declare readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Удаление одной позиции из корзины',
    })
    declare readonly products: ProductModel[];
}
