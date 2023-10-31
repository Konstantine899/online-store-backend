import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
export interface IPaginateProductDto {
    page: number;
    size: number;
}

export class PaginateProductDto implements IPaginateProductDto {
    @IsOptional()
    @Transform((value) => Number(value))
    readonly page: number;

    @IsOptional()
    @Transform((value) => Number(value))
    readonly size: number;
}
