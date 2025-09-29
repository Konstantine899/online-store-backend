import { IsString, IsOptional, IsBoolean, Length, IsNotEmpty } from 'class-validator';

export class CreateUserAddressDto {
    @IsString({ message: 'Название адреса должно быть строкой' })
    @IsNotEmpty({ message: 'Название адреса обязательно' })
    @Length(1, 100, { message: 'Название адреса должно быть от 1 до 100 символов' })
    declare readonly title: string;

    @IsString({ message: 'Улица должна быть строкой' })
    @IsNotEmpty({ message: 'Улица обязательна' })
    @Length(1, 255, { message: 'Улица должна быть от 1 до 255 символов' })
    declare readonly street: string;

    @IsString({ message: 'Дом должен быть строкой' })
    @IsNotEmpty({ message: 'Дом обязателен' })
    @Length(1, 20, { message: 'Дом должен быть от 1 до 20 символов' })
    declare readonly house: string;

    @IsOptional()
    @IsString({ message: 'Квартира должна быть строкой' })
    @Length(1, 20, { message: 'Квартира должна быть от 1 до 20 символов' })
    declare readonly apartment?: string;

    @IsString({ message: 'Город должен быть строкой' })
    @IsNotEmpty({ message: 'Город обязателен' })
    @Length(1, 100, { message: 'Город должен быть от 1 до 100 символов' })
    declare readonly city: string;

    @IsOptional()
    @IsString({ message: 'Почтовый индекс должен быть строкой' })
    @Length(1, 20, { message: 'Почтовый индекс должен быть от 1 до 20 символов' })
    declare readonly postal_code?: string;

    @IsOptional()
    @IsString({ message: 'Страна должна быть строкой' })
    @Length(1, 100, { message: 'Страна должна быть от 1 до 100 символов' })
    declare readonly country?: string;

    @IsOptional()
    @IsBoolean({ message: 'Флаг основного адреса должен быть булевым значением' })
    declare readonly is_default?: boolean;
}