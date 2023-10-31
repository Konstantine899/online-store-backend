import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface ILogoutResponse {
    status: number;
    message: string;
}

export class LogoutResponse implements ILogoutResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
