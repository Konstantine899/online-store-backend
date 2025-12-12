import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { TranslationEntryDto } from './translation-entry.dto';

/**
 * DTO для обновления персональных переводов пользователя
 * Валидация каждой записи через TranslationEntryDto
 */
export class UpdateTranslationsDto {
    @ApiProperty({
        description: 'Массив персональных переводов пользователя',
        type: [TranslationEntryDto],
        example: [
            { key: 'welcome.title', value: 'Привет!' },
            { key: 'button.submit', value: 'Отправить' },
            { key: 'error.not_found', value: 'Не найдено' },
        ],
        maxItems: 100,
    })
    @IsArray({ message: 'Переводы должны быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => TranslationEntryDto)
    @ArrayMaxSize(100, {
        message: 'Максимальное количество переводов: 100',
    })
    declare readonly translations: TranslationEntryDto[];
}


