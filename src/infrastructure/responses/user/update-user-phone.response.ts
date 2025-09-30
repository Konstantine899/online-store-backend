import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserPhoneResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    declare readonly id: number;

    @ApiProperty({ example: '+79991234567', description: 'Номер телефона пользователя (E.164)' })
    declare readonly phone: string;
}


