import { BrandModel } from '../../../domain/models/brand.model';
import { ApiProperty } from '@nestjs/swagger';

export class BrandResponse extends BrandModel {
    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    readonly id: number;

    @ApiProperty({ example: 'Bosh', description: 'Имя бренда' })
    readonly name: string;
}
