import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
export interface PaginateProduct {
    page: number;
    size: number;
}

export class PaginateProductDto implements PaginateProduct {
    @IsOptional()
    @Transform((value) => Number(value))
    readonly page: number;

    @IsOptional()
    @Transform((value) => Number(value))
    readonly size: number;
}
