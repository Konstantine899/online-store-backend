import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IAddRoleDto } from '@app/domain/dto';

export class AddRoleDto implements IAddRoleDto {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    @Transform((value) => Number(value))
    declare readonly userId: number;

    @ApiProperty({
        example: 'ADMIN',
        description: 'Роль пользователя',
    })
    @IsNotEmpty({ message: 'Укажите role пользователя' })
    @IsString({ message: 'Поле role должно быть строкой' })
    declare readonly role: string;
}
