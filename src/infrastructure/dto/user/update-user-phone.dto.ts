import { IsValidPhone } from '@app/infrastructure/common/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserPhoneDto {
    @ApiProperty({
        example: '+79991234567',
        description:
            'Номер телефона (поддерживаются российские форматы: +7, 8, 7 и международный формат E.164)',
    })
    @IsNotEmpty({ message: 'Укажите номер телефона' })
    @IsString({ message: 'Телефон должен быть строкой' })
    @IsValidPhone({ message: 'Неверный формат номера телефона' })
    declare readonly phone: string;
}
