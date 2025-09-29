import { ApiProperty } from '@nestjs/swagger';

// Интерфейсы для типизации
export interface IUserAddressResponse {
    readonly id: number;
    readonly user_id: number;
    readonly title: string;
    readonly street: string;
    readonly house: string;
    readonly apartment?: string;
    readonly city: string;
    readonly postal_code?: string;
    readonly country: string;
    readonly is_default: boolean;
}

export interface IRemoveUserAddressResponse {
    readonly message: string;
}

export class UserAddressResponse implements IUserAddressResponse {
    private static readonly API_EXAMPLES = {
        ID: 1,
        USER_ID: 3,
        TITLE: 'Дом',
        STREET: 'ул. Пушкина',
        HOUSE: '10',
        APARTMENT: '12',
        CITY: 'Москва',
        POSTAL_CODE: '101000',
        COUNTRY: 'Россия',
        IS_DEFAULT: true,
    } as const;
    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.ID, 
        description: 'Идентификатор адреса' 
    })
    declare readonly id: number;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.USER_ID, 
        description: 'Идентификатор пользователя' 
    })
    declare readonly user_id: number;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.TITLE, 
        description: 'Название адреса' 
    })
    declare readonly title: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.STREET, 
        description: 'Улица' 
    })
    declare readonly street: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.HOUSE, 
        description: 'Дом' 
    })
    declare readonly house: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.APARTMENT, 
        description: 'Квартира', 
        required: false 
    })
    declare readonly apartment?: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.CITY, 
        description: 'Город' 
    })
    declare readonly city: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.POSTAL_CODE, 
        description: 'Почтовый индекс', 
        required: false 
    })
    declare readonly postal_code?: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.COUNTRY, 
        description: 'Страна' 
    })
    declare readonly country: string;

    @ApiProperty({ 
        example: UserAddressResponse.API_EXAMPLES.IS_DEFAULT, 
        description: 'Основной адрес' 
    })
    declare readonly is_default: boolean;
}

// Type aliases вместо пустых классов
export type CreateUserAddressResponse = UserAddressResponse;
export type UpdateUserAddressResponse = UserAddressResponse;
export type GetUserAddressResponse = UserAddressResponse;

export class RemoveUserAddressResponse implements IRemoveUserAddressResponse {
    private static readonly SUCCESS_MESSAGE = 'Адрес успешно удалён';
    
    @ApiProperty({ example: RemoveUserAddressResponse.SUCCESS_MESSAGE })
    declare readonly message: string;
}