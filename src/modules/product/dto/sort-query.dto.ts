import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Sort {
    DESC = 'desc',
    ASC = 'asc',
}
export class SortQueryDto {
    @ApiProperty({ enum: Sort, description: 'Сортировка цены' })
    @IsOptional()
    readonly sort: string;
}
