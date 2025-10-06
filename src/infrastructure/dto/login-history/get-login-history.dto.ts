import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLoginHistoryDto {
    @ApiPropertyOptional({
        example: 10,
        description: 'Количество записей для получения',
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Лимит должен быть целым числом' })
    @Min(1, { message: 'Лимит должен быть не менее 1' })
    @Max(100, { message: 'Лимит должен быть не более 100' })
    declare readonly limit?: number;

    @ApiPropertyOptional({
        example: 0,
        description: 'Смещение для пагинации',
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Смещение должно быть целым числом' })
    @Min(0, { message: 'Смещение должно быть не менее 0' })
    declare readonly offset?: number;
}
