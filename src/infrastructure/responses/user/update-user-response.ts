import { UserModel, RoleModel } from '@app/domain/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserResponse extends UserModel {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    declare id: number;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Электронная почта пользователя',
    })
    declare email: string;

    @ApiProperty({
        example: 'Иван',
        description: 'Имя пользователя',
        required: false,
    })
    declare firstName?: string;

    @ApiProperty({
        example: 'Иванов',
        description: 'Фамилия пользователя',
        required: false,
    })
    declare lastName?: string;

    @ApiProperty({ type: () => [RoleModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleModel)
    declare roles: RoleModel[];
}
