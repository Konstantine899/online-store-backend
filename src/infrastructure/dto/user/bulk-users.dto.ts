import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

/**
 * DTO для массовых операций с пользователями
 * Используется для активации, деактивации, блокировки и т.д.
 * Ограничения: минимум 1, максимум 100 пользователей за один запрос
 */
export class BulkUsersDto {
    @ApiProperty({
        description:
            'Массив ID пользователей для массовой операции (от 1 до 100)',
        example: [1, 2, 3, 4, 5],
        type: [Number],
        minItems: 1,
        maxItems: 100,
    })
    @IsArray({ message: 'Поле userIds должно быть массивом' })
    @ArrayMinSize(1, {
        message: 'Массив userIds должен содержать минимум 1 элемент',
    })
    @ArrayMaxSize(100, {
        message: 'Массив userIds не может содержать более 100 элементов',
    })
    @IsInt({
        each: true,
        message: 'Каждый элемент массива userIds должен быть целым числом',
    })
    declare readonly userIds: number[];
}

