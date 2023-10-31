import { ApiProperty } from '@nestjs/swagger';
import { RoleModel } from '../../../modules/role/role.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

interface ICheckResponse {
    id: number;
    email: string;
    roles: RoleModel[];
}

export class CheckResponse implements ICheckResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
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
