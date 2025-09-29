import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    declare readonly id: number;

    @ApiProperty({ example: 'Смартфоны', description: 'Имя категории' })
    declare readonly name: string;

    @ApiProperty({
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
    })
    declare readonly image: string;

    @ApiProperty({
        example: '2023-05-11T13:23:32.511Z',
        description: 'Время обновления',
    })
    declare readonly updatedAt?: string;
}
