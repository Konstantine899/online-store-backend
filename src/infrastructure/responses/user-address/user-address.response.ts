import { ApiProperty } from '@nestjs/swagger';

export class UserAddressResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор адреса' })
    declare readonly id: number;

    @ApiProperty({ example: 3, description: 'Идентификатор пользователя' })
    declare readonly user_id: number;

    @ApiProperty({ example: 'Дом', description: 'Название адреса' })
    declare readonly title: string;

    @ApiProperty({ example: 'ул. Пушкина', description: 'Улица' })
    declare readonly street: string;

    @ApiProperty({ example: '10', description: 'Дом' })
    declare readonly house: string;

    @ApiProperty({ example: '12', description: 'Квартира', required: false })
    declare readonly apartment?: string;

    @ApiProperty({ example: 'Москва', description: 'Город' })
    declare readonly city: string;

    @ApiProperty({ example: '101000', description: 'Почтовый индекс', required: false })
    declare readonly postal_code?: string;

    @ApiProperty({ example: 'Россия', description: 'Страна' })
    declare readonly country: string;

    @ApiProperty({ example: true, description: 'Основной адрес' })
    declare readonly is_default: boolean;
}

export class CreateUserAddressResponse extends UserAddressResponse {}
export class UpdateUserAddressResponse extends UserAddressResponse {}
export class GetUserAddressResponse extends UserAddressResponse {}

export class RemoveUserAddressResponse {
    @ApiProperty({ example: 'Адрес успешно удалён' })
    declare readonly message: string;
}