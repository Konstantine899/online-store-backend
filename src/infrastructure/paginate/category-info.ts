import { CategoryModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryInfo extends CategoryModel {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории',
    })
    declare id: number;

    @ApiProperty({
        example: 'Смартфоны',
        description: 'Название категории',
    })
    declare name: string;

    @ApiProperty({
        example: '471d35be-9906-4cee-a681-76a53a19bd25.png',
        description: 'Имя и расширение картинки',
    })
    declare image: string;

    @ApiProperty({
        example: 'smartfony',
        description: 'URL-friendly идентификатор категории',
    })
    declare slug: string;

    @ApiProperty({
        example: 'Категория мобильных устройств',
        description: 'Описание категории',
        required: false,
    })
    declare description?: string;

    @ApiProperty({
        example: true,
        description: 'Активна ли категория',
    })
    declare isActive: boolean;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор тенанта',
    })
    declare tenant_id: number;
}
