import { IUpdateCartItemDto } from '@app/domain/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO для обновления количества товара в корзине
 */
export class UpdateCartItemDto implements IUpdateCartItemDto {
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
        example: 1,
        description:
            'Изменение количества товара (положительное для увеличения, отрицательное для уменьшения)',
    })
    @IsNotEmpty({ message: 'Укажите изменение количества' })
    @IsInt({ message: 'Изменение количества должно быть целым числом' })
    declare readonly amount: number;
}
