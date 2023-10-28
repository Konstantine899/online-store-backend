import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IRemoveRoleResponse {
    status: number;
    message: string;
}

export class RemoveRoleResponse implements IRemoveRoleResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
