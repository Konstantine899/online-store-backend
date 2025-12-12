import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';
import { IUpdateUserAddressDto } from '@app/domain/dto';

/**
 * DTO для обновления адреса пользователя
 * Все поля опциональные — обновляются только переданные
 */
export class UpdateUserAddressDto implements IUpdateUserAddressDto {
    @ApiPropertyOptional({
        example: 'Квартира',
        description: 'Название адреса (например: Дом, Работа, Дача)',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Название адреса должно быть строкой' })
    @MaxLength(100, {
        message: 'Название адреса не должно превышать 100 символов',
    })
    @IsSanitizedString({ message: 'Название содержит недопустимые символы' })
    declare readonly title?: string;

    @ApiPropertyOptional({
        example: 'ул. Ленина',
        description: 'Название улицы',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Название улицы должно быть строкой' })
    @MaxLength(255, {
        message: 'Название улицы не должно превышать 255 символов',
    })
    @IsSanitizedString({ message: 'Улица содержит недопустимые символы' })
    declare readonly street?: string;

    @ApiPropertyOptional({
        example: '5А',
        description: 'Номер дома',
        maxLength: 20,
    })
    @IsOptional()
    @IsString({ message: 'Номер дома должен быть строкой' })
    @MaxLength(20, { message: 'Номер дома не должен превышать 20 символов' })
    @IsSanitizedString({ message: 'Номер дома содержит недопустимые символы' })
    declare readonly house?: string;

    @ApiPropertyOptional({
        example: '45',
        description: 'Номер квартиры',
        maxLength: 20,
    })
    @IsOptional()
    @IsString({ message: 'Номер квартиры должен быть строкой' })
    @MaxLength(20, {
        message: 'Номер квартиры не должен превышать 20 символов',
    })
    @IsSanitizedString({
        message: 'Номер квартиры содержит недопустимые символы',
    })
    declare readonly apartment?: string;

    @ApiPropertyOptional({
        example: 'Санкт-Петербург',
        description: 'Город',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Город должен быть строкой' })
    @MaxLength(100, { message: 'Город не должен превышать 100 символов' })
    @IsSanitizedString({ message: 'Город содержит недопустимые символы' })
    declare readonly city?: string;

    @ApiPropertyOptional({
        example: '654321',
        description: 'Почтовый индекс',
        maxLength: 20,
    })
    @IsOptional()
    @IsString({ message: 'Почтовый индекс должен быть строкой' })
    @MaxLength(20, {
        message: 'Почтовый индекс не должен превышать 20 символов',
    })
    @IsSanitizedString({
        message: 'Почтовый индекс содержит недопустимые символы',
    })
    declare readonly postal_code?: string;

    @ApiPropertyOptional({
        example: 'Беларусь',
        description: 'Страна',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Страна должна быть строкой' })
    @MaxLength(100, { message: 'Страна не должна превышать 100 символов' })
    @IsSanitizedString({ message: 'Страна содержит недопустимые символы' })
    declare readonly country?: string;

    @ApiPropertyOptional({
        example: true,
        description:
            'Является ли адрес адресом по умолчанию (автоматически отменяет другие default)',
    })
    @IsOptional()
    @IsBoolean({ message: 'Поле is_default должно быть булевым значением' })
    declare readonly is_default?: boolean;
}
