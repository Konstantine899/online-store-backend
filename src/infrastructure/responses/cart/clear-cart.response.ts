import { ICartTransformData } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';
import { ProductModel } from '@app/domain/models';

export class ClearCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Пустая корзина',
    })
    readonly products: ProductModel[];
}
