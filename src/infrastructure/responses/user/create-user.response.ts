import { UserModel, RoleModel } from '@app/domain/models';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponse extends UserModel {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    id: number;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Электронная почта пользователя',
    })
    email: string;

    @ApiProperty({ type: () => [RoleModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleModel)
    roles: RoleModel[];
}
