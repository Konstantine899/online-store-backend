import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ISearchDto } from '../../../domain/dto/product/i-search-dto';

export class SearchDto implements ISearchDto {
    @ApiProperty({
        example: 'Xiaomi Redmi Note 10 Pro',
        description: 'Поиск производится по имени продукта',
    })
    @IsOptional()
    readonly search: string;
}
