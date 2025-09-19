import { CategoryModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponse extends CategoryModel {
    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    declare readonly id: number;
    @ApiProperty({ example: 'Смартфоны', description: 'Имя категории' })
    declare readonly name: string;
}
