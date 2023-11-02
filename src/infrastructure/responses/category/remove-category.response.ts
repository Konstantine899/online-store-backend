import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { IRemoveCategoryResponse } from '../../../domain/responses/category/i-remove-category-response';

export class RemoveCategoryResponse implements IRemoveCategoryResponse {
    @ApiProperty({ example: HttpStatus.OK })
    readonly status: number;

    @ApiProperty({ example: 'success' })
    readonly message: string;
}
