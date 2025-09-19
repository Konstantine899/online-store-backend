import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IAdminRemoveOrderResponse } from '@app/domain/responses';

export class AdminRemoveOrderResponse implements IAdminRemoveOrderResponse {
    @ApiProperty({ example: HttpStatus.OK })
    declare readonly status: number;

    @ApiProperty({ example: 'success' })
    declare readonly message: string;
}
