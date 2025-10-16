import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IAddToCartDto } from '@app/domain/dto';
import { CART_CONSTANTS } from '@app/domain/models/constants/cart.constants';

/**
 * DTO для добавления товара в корзину
 */
export class AddToCartDto implements IAddToCartDto {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор товара',
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Укажите ID товара' })
    @IsInt({ message: 'ID товара должен быть целым числом' })
    @Min(1, { message: 'ID товара должен быть больше 0' })
    declare readonly productId: number;

    @ApiProperty({
        example: 2,
        description: 'Количество товара',
        minimum: CART_CONSTANTS.MIN_ITEM_QUANTITY,
        maximum: CART_CONSTANTS.MAX_ITEM_QUANTITY,
    })
    @IsNotEmpty({ message: 'Укажите количество товара' })
    @IsInt({ message: 'Количество должно быть целым числом' })
    @Min(CART_CONSTANTS.MIN_ITEM_QUANTITY, {
        message: `Минимальное количество: ${CART_CONSTANTS.MIN_ITEM_QUANTITY}`,
    })
    @Max(CART_CONSTANTS.MAX_ITEM_QUANTITY, {
        message: `Максимальное количество: ${CART_CONSTANTS.MAX_ITEM_QUANTITY}`,
    })
    declare readonly quantity: number;
}
