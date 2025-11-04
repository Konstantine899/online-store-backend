import { ApiProperty } from '@nestjs/swagger';

export class UpdateDateOfBirthResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;

    @ApiProperty({
        example: '1990-01-15',
        description: 'Дата рождения пользователя (YYYY-MM-DD)',
        type: String,
        format: 'date',
    })
    declare readonly dateOfBirth: string | null;
}
