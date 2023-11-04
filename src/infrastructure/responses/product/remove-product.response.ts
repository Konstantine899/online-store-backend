import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IRemoveProductResponse } from '@app/domain/responses';

export class RemoveProductResponse implements IRemoveProductResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
