import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveProductPropertyResponse {
    status: number;
    message: string;
}

export class RemoveProductPropertyResponse
    implements IRemoveProductPropertyResponse
{
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
