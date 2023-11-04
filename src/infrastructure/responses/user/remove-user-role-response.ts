import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IRemoveUserRoleResponse } from '@app/domain/responses';

export class RemoveUserRoleResponse implements IRemoveUserRoleResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
