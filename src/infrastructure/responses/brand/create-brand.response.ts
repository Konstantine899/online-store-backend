import { BrandModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateBrandResponse extends BrandModel {
    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    readonly id: number;

    @ApiProperty({ example: 'Bosh', description: 'Имя бренда' })
    readonly name: string;

    @IsOptional()
    @ApiProperty({
        example: '2023-05-11T08:42:14.588Z',
        required: false,
        description: 'Время обновления',
    })
    readonly updatedAt?: string;

    @IsOptional()
    @ApiProperty({
        example: '2023-05-11T08:42:14.588Z',
        required: false,
        description: 'Время создания',
    })
    readonly createdAt?: string;

    @ApiProperty({ example: 1, description: 'category_id' })
    readonly category_id: number;
}
