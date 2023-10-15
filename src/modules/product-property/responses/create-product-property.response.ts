import { ProductPropertyModel } from '../product-property.model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductPropertyResponse extends ProductPropertyModel {
    @ApiProperty({ example: 1, description: 'Идентификатор свойства' })
    id: number;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    productId: number;

    @ApiProperty({
        example: 'Объем встроенной памяти',
        description: 'Имя свойства',
    })
    name: string;

    @ApiProperty({
        example: '256 ГБ',
        description: 'Значение свойства',
    })
    value: string;

    @ApiProperty({
        example: '2023-05-10T11:46:40.961Z',
        description: 'Время обновления свойства',
        required: false,
    })
    updatedAt?: string;

    @ApiProperty({
        example: '2023-05-10T11:46:40.961Z',
        description: 'Время создания свойства',
        required: false,
    })
    createdAt?: string;
}
