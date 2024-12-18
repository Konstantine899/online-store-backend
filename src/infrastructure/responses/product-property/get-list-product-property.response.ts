import { ProductPropertyModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class GetListProductPropertyResponse extends ProductPropertyModel {
    @ApiProperty({ example: 1, description: 'Идентификатор свойства' })
    id: number;

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

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    product_id: number;
}
