import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
    ISortingDto,
    SortingEnum,
} from '../../../domain/dto/product/i-sorting-dto';

export class SortingDto implements ISortingDto {
    @ApiProperty({ enum: SortingEnum, description: 'Сортировка цены' })
    @IsOptional()
    readonly sort: string;
}
