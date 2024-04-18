import { CategoryModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryResponse extends CategoryModel {
    @ApiProperty({ example: 1, description: 'Идентификатор категории' })
    readonly id: number;

    @ApiProperty({ example: 'Смартфоны', description: 'Имя категории' })
    readonly name: string;

    @ApiProperty({
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
    })
    image: string;

    @ApiProperty({
        example: '2023-05-11T13:23:32.511Z',
        description: 'Время обновления',
    })
    readonly updatedAt?: string;
}
