import { ApiProperty } from '@nestjs/swagger';
import { RoleModel } from '@app/domain/models';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ICheckResponse } from '@app/domain/responses';

export class CheckResponse implements ICheckResponse {
    @ApiProperty({
        example: 1,
        description: 'Идентификатор пользователя',
    })
    declare readonly id: number;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Электронная почта пользователя',
    })
    declare readonly email: string;

    @ApiProperty({ type: () => [RoleModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleModel)
    declare readonly roles: RoleModel[];
}
