import { ProductPropertyModel } from '../../../domain/models/product-property.model';
import { ApiProperty } from '@nestjs/swagger';

export class GetProductPropertyResponse extends ProductPropertyModel {
    @ApiProperty({ example: 1, description: 'Идентификатор свойства' })
    id: number;

    @ApiProperty({
        example: 'Емкость аккумулятора:',
        description: 'Имя свойства',
    })
    'name': string;

    @ApiProperty({ example: '5000 мА·ч', description: 'Значение свойства' })
    'value': string;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    product_id: number;
}
