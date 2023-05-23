import { BrandModel } from '../brand.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateBrandResponse extends BrandModel {
  @ApiProperty({ example: 1 })
  readonly id: number;
  @ApiProperty({ example: 'Bosh' })
  readonly name: string;

  @IsOptional()
  @ApiProperty({ example: '2023-05-11T08:42:14.588Z', required: false })
  readonly updatedAt?: string;

  @IsOptional()
  @ApiProperty({ example: '2023-05-11T08:42:14.588Z', required: false })
  readonly createdAt?: string;
}
