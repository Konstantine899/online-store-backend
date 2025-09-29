import { ApiProperty } from '@nestjs/swagger';

export class ListAllCategoriesResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    declare readonly id: number;
    @ApiProperty({ example: 'Смартфоны', description: 'Имя категории' })
    declare readonly name: string;
    @ApiProperty({ example: 'image.png', required: false, description: 'Имя файла изображения' })
    declare readonly image?: string;
}
