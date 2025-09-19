import { ProductPropertyModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class GetProductPropertyResponse extends ProductPropertyModel {
    @ApiProperty({ example: 1, description: 'Идентификатор свойства' })
    declare id: number;

    @ApiProperty({
        example: 'Емкость аккумулятора:',
        description: 'Имя свойства',
    })
    declare name: string;

    @ApiProperty({ example: '5000 мА·ч', description: 'Значение свойства' })
    declare value: string;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    declare product_id: number;
}
