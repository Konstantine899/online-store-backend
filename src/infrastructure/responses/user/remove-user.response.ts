import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveUserResponse {
    status: number;
    message: string;
}

export class RemoveUserResponse implements IRemoveUserResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
