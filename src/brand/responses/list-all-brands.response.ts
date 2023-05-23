import { BrandModel } from '../brand.model';
import { ApiProperty } from '@nestjs/swagger';

export class ListAllBrandsResponse extends BrandModel {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: 'Bosh' })
  readonly name: string;
}
