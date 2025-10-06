import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsPasswordStrong } from '@app/infrastructure/common/validators/password-strength.validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldPass123!',
        description: 'Текущий пароль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите текущий пароль' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    declare readonly oldPassword: string;

    @ApiProperty({
        example: 'NewSecure123!',
        description: 'Новый пароль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите новый пароль' })
    @IsString({ message: 'Поле пароля должно быть строкой' })
    @IsPasswordStrong({ message: 'Пароль недостаточно сложный' })
    declare readonly newPassword: string;
}
