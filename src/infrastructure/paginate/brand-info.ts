import { BrandModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class BrandInfo extends BrandModel {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор бренда',
    })
    declare id: number;

    @ApiProperty({
        example: 'Apple',
        description: 'Название бренда',
    })
    declare name: string;

    @ApiProperty({
        example: 'apple',
        description: 'URL-friendly идентификатор бренда',
    })
    declare slug: string;

    @ApiProperty({
        example: 'Американский производитель электроники',
        description: 'Описание бренда',
        required: false,
    })
    declare description?: string;

    @ApiProperty({
        example: true,
        description: 'Активен ли бренд',
    })
    declare isActive: boolean;

    @ApiProperty({
        example: 'apple-logo.png',
        description: 'Логотип бренда',
        required: false,
    })
    declare logo?: string;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор категории',
    })
    declare category_id: number;

    @ApiProperty({
        example: 1,
        description: 'Идентификатор тенанта',
    })
    declare tenant_id: number;
}

