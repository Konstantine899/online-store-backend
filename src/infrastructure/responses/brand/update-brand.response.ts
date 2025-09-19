import { BrandModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateBrandResponse extends BrandModel {
    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    declare readonly id: number;
    @ApiProperty({ example: 'Bosh', description: 'Имя бренда' })
    declare readonly name: string;

    @IsOptional()
    @ApiProperty({
        example: '2023-05-11T08:42:14.588Z',
        required: false,
        description: 'Время обновления',
    })
    declare readonly updatedAt?: string;

    @ApiProperty({ example: 1, description: 'category_id' })
    declare readonly category_id: number;
}
