import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class RemoveProductResponse {
  @ApiProperty({ example: HttpStatus.OK })
  readonly status: number;

  @ApiProperty({ example: `success` })
  readonly message: string;
}
