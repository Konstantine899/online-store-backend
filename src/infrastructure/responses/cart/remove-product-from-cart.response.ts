import { ICartTransformData } from '../../../domain/transform/cart/i-cart-transform-data';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '../../../domain/models/product.model';

export class RemoveProductFromCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Удаление одной позиции из корзины',
    })
    readonly products: ProductModel[];
}
