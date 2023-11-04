import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IRemoveRoleDto } from '@app/domain/dto';

export class RemoveRoleDto implements IRemoveRoleDto {
    @ApiProperty({ example: '1', description: 'Идентификатор пользователя' })
    @Transform((value) => Number(value))
    readonly userId: number;

    @ApiProperty({ example: 'ADMIN', description: 'Роль пользователя' })
    @IsNotEmpty({ message: 'Укажите role пользователя' })
    @IsString({ message: 'Поле role должно быть строкой' })
    readonly role: string;
}
