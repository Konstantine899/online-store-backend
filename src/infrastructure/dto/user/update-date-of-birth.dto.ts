import { IsValidAge } from '@app/infrastructure/common/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateDateOfBirthDto {
    @ApiProperty({
        example: '1990-01-15',
        description:
            'Дата рождения пользователя в формате YYYY-MM-DD. Возраст должен быть от 18 до 150 лет',
        type: String,
        format: 'date',
    })
    @IsNotEmpty({ message: 'Укажите дату рождения' })
    @IsDateString(
        {},
        { message: 'Дата рождения должна быть в формате YYYY-MM-DD' },
    )
    @IsValidAge({
        message:
            'Дата рождения должна соответствовать возрасту от 18 до 150 лет',
    })
    declare readonly dateOfBirth: string;
}
