import { ICartTransformData, ICartProductItem } from '@app/domain/transform';
import { ApiProperty } from '@nestjs/swagger';


export class RemoveProductFromCartResponse implements ICartTransformData {
    @ApiProperty({ example: 26, description: 'Идентификатор корзины' })
    declare readonly cartId: number;

    @ApiProperty({
        example: [],
        description: 'Удаление одной позиции из корзины',
    })
    declare readonly products: ICartProductItem[];
}
