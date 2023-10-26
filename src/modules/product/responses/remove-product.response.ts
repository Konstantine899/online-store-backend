import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveProductResponse {
    status: number;
    message: string;
}

export class RemoveProductResponse implements IRemoveProductResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
