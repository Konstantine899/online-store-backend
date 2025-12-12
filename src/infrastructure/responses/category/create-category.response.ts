import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    declare readonly id: number;
    @ApiProperty({ example: 'Смартфоны', description: 'Имя категории' })
    declare readonly name: string;

    @ApiProperty({
        example: '2023-05-11T12:24:33.702Z',
        required: false,
        description: 'Время обновления',
    })
    declare readonly updatedAt?: string;
    @ApiProperty({
        example: '2023-05-11T12:24:33.702Z',
        required: false,
        description: 'Время создания',
    })
    declare readonly createdAt?: string;
}
