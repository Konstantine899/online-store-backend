import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

interface IAdminRemoveOrderResponse {
    status: number;
    message: string;
}

export class AdminRemoveOrderResponse implements IAdminRemoveOrderResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
