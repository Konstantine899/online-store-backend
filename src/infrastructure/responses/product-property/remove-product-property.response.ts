import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IRemoveProductPropertyResponse } from '@app/domain/responses';

export class RemoveProductPropertyResponse
    implements IRemoveProductPropertyResponse
{
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
