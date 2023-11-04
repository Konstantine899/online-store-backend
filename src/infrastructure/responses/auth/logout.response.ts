import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { ILogoutResponse } from '@app/domain/responses';

export class LogoutResponse implements ILogoutResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
