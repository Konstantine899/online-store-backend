import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveBrandResponse {
    status: number;
    message: string;
}

export class RemoveBrandResponse implements IRemoveBrandResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
