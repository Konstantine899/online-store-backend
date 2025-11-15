import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для одной записи перевода
 * Ключ должен быть в формате: namespace.key (например: 'welcome.title', 'button.submit')
 */
export class TranslationEntryDto {
    @ApiProperty({
        description:
            'Ключ перевода в формате namespace.key (lowercase, разделитель - точка)',
        example: 'welcome.title',
        pattern: '^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$',
    })
    @IsString({ message: 'Ключ перевода должен быть строкой' })
    @Matches(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, {
        message:
            'Ключ перевода должен быть в формате namespace.key (только lowercase, цифры и подчеркивания)',
    })
    @MinLength(3, {
        message: 'Ключ перевода должен содержать минимум 3 символа',
    })
    @MaxLength(100, {
        message: 'Ключ перевода не должен превышать 100 символов',
    })
    declare readonly key: string;

    @ApiProperty({
        description: 'Текст перевода (любая строка)',
        example: 'Добро пожаловать!',
        maxLength: 1000,
    })
    @IsString({ message: 'Значение перевода должно быть строкой' })
    @MinLength(1, { message: 'Значение перевода не может быть пустым' })
    @MaxLength(1000, {
        message: 'Значение перевода не должно превышать 1000 символов',
    })
    declare readonly value: string;
}


