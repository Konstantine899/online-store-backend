import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidPhone } from '@app/infrastructure/common/validators';

export class UpdateUserPhoneDto {
    @ApiProperty({
        example: '+79991234567',
        description: 'Номер телефона в международном формате E.164',
    })
    @IsNotEmpty({ message: 'Укажите номер телефона' })
    @IsString({ message: 'Телефон должен быть строкой' })
    @IsValidPhone({ message: 'Неверный формат номера телефона' })
    declare readonly phone: string;
}