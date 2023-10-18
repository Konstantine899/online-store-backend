import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface SearchQuery {
    search: string;
}

export class SearchQueryDto implements SearchQuery {
    @ApiProperty({
        example: 'Xiaomi Redmi Note 10 Pro',
        description: 'Поиск производится по имени продукта',
    })
    @IsOptional()
    readonly search: string;
}
