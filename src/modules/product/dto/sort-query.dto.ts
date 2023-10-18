import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface SortQuery {
    sort: string;
}

export enum Sort {
    DESC = 'desc',
    ASC = 'asc',
}
export class SortQueryDto implements SortQuery {
    @ApiProperty({ enum: Sort, description: 'Сортировка цены' })
    @IsOptional()
    readonly sort: string;
}
