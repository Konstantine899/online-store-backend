import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IRemoveCategoryResponse } from '@app/domain/responses';

export class RemoveCategoryResponse implements IRemoveCategoryResponse {
    @ApiProperty({ example: HttpStatus.OK })
    declare readonly status: number;

    @ApiProperty({ example: 'success' })
    declare readonly message: string;
}
