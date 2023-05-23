import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class RemoveBrandResponse {
  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ example: `success` })
  message: string;
}
