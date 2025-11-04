import { IsValidName } from '@app/infrastructure/common/validators/name.validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
    @ApiPropertyOptional({
        example: 'Иван',
        description: 'Имя пользователя',
    })
    @IsOptional()
    @IsValidName({
        message:
            'Имя должно содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы',
    })
    declare readonly firstName?: string;

    @ApiPropertyOptional({
        example: 'Иванов',
        description: 'Фамилия пользователя',
    })
    @IsOptional()
    @IsValidName({
        message:
            'Фамилия должна содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы',
    })
    declare readonly lastName?: string;
}
