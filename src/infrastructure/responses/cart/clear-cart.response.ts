import { ICartTransformData, ICartProductItem } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';

export class ClearCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    declare readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Пустая корзина',
    })
    declare readonly products: ICartProductItem[];
}
