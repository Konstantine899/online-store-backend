import { ProductPropertyModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class GetListProductPropertyResponse extends ProductPropertyModel {
    @ApiProperty({ example: 1, description: 'Идентификатор свойства' })
    declare id: number;

    @ApiProperty({
        example: 'Объем встроенной памяти',
        description: 'Имя свойства',
    })
    declare name: string;

    @ApiProperty({
        example: '256 ГБ',
        description: 'Значение свойства',
    })
    declare value: string;

    @ApiProperty({ example: 1, description: 'Идентификатор продукта' })
    declare product_id: number;
}
