import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface ISortQueryDto {
    sort: string;
}

export enum Sort {
    DESC = 'desc',
    ASC = 'asc',
}
export class SortQueryDto implements ISortQueryDto {
    @ApiProperty({ enum: Sort, description: 'Сортировка цены' })
    @IsOptional()
    readonly sort: string;
}
