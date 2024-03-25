import { BrandModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class ListAllBrandsByCategoryResponse extends BrandModel {
    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    readonly id: number;
    @ApiProperty({ example: 'Bosh', description: 'Имя бренда' })
    readonly name: string;
}
