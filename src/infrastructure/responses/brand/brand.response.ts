import { BrandModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';

export class BrandResponse extends BrandModel {
    @ApiProperty({ example: 1, description: 'Идентификатор бренда' })
    declare readonly id: number;

    @ApiProperty({ example: 'Bosh', description: 'Имя бренда' })
    declare readonly name: string;
}
