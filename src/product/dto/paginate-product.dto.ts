import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginateProductDto {
    @IsOptional()
    @Transform((value) => Number(value))
    readonly page: number;

    @IsOptional()
    @Transform((value) => Number(value))
    readonly size: number;
}
