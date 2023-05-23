import { BrandModel } from '../brand.model';
import { ApiProperty } from '@nestjs/swagger';

export class BrandResponse extends BrandModel {
  @ApiProperty({ example: 1 })
  readonly id: number;

  @ApiProperty({ example: 'Bosh' })
  readonly name: string;
}
