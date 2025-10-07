import {
    IsNotEmpty,
    IsString,
    MaxLength,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsSanitizedString } from '@app/infrastructure/common/validators/sanitize-string.validator';
import { ICreateUserAddressDto } from '@app/domain/dto';

/**
 * DTO для создания адреса пользователя
 * Используется для добавления нового адреса доставки в профиль
 */
export class CreateUserAddressDto implements ICreateUserAddressDto {
    @ApiProperty({
        example: 'Дом',
        description: 'Название адреса (например: Дом, Работа, Дача)',
        maxLength: 100,
    })
    @IsNotEmpty({ message: 'Укажите название адреса' })
    @IsString({ message: 'Название адреса должно быть строкой' })
    @MaxLength(100, {
        message: 'Название адреса не должно превышать 100 символов',
    })
    @IsSanitizedString({ message: 'Название содержит недопустимые символы' })
    declare readonly title: string;

    @ApiProperty({
        example: 'ул. Пушкина',
        description: 'Название улицы',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Укажите название улицы' })
    @IsString({ message: 'Название улицы должно быть строкой' })
    @MaxLength(255, {
        message: 'Название улицы не должно превышать 255 символов',
    })
    @IsSanitizedString({ message: 'Улица содержит недопустимые символы' })
    declare readonly street: string;

    @ApiProperty({
        example: '10',
        description: 'Номер дома',
        maxLength: 20,
    })
    @IsNotEmpty({ message: 'Укажите номер дома' })
    @IsString({ message: 'Номер дома должен быть строкой' })
    @MaxLength(20, { message: 'Номер дома не должен превышать 20 символов' })
    @IsSanitizedString({ message: 'Номер дома содержит недопустимые символы' })
    declare readonly house: string;

    @ApiPropertyOptional({
        example: '12',
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

    @ApiProperty({
        example: 'Москва',
        description: 'Город',
        maxLength: 100,
    })
    @IsNotEmpty({ message: 'Укажите город' })
    @IsString({ message: 'Город должен быть строкой' })
    @MaxLength(100, { message: 'Город не должен превышать 100 символов' })
    @IsSanitizedString({ message: 'Город содержит недопустимые символы' })
    declare readonly city: string;

    @ApiPropertyOptional({
        example: '123456',
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
        example: 'Россия',
        description: 'Страна',
        maxLength: 100,
        default: 'Россия',
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
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'Поле is_default должно быть булевым значением' })
    declare readonly is_default?: boolean;
}
