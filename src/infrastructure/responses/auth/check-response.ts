import { ApiProperty } from '@nestjs/swagger';
import { RoleModel } from '../../../domain/models/role.model';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ICheckResponse } from '../../../domain/responses/auth/i-check-response';

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
