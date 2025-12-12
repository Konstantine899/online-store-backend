import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ConfirmVerificationDto {
    @ApiProperty({ description: 'Код подтверждения', example: '123456' })
    @IsNotEmpty({ message: 'Код обязателен' })
    @IsString({ message: 'Код должен быть строкой' })
    @Length(4, 8, { message: 'Длина кода должна быть от 4 до 8 символов' })
    @Matches(/^[0-9A-Za-z]+$/, {
        message: 'Код должен содержать только буквы и цифры',
    })
    declare readonly code: string;
}
