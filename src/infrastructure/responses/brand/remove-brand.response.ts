import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveBrandResponse {
    status: number;
    message: string;
}

export class RemoveBrandResponse implements IRemoveBrandResponse {
    @ApiProperty({ example: HttpStatus.OK })
    declare readonly status: number;

    @ApiProperty({ example: 'success' })
    declare readonly message: string;
}
