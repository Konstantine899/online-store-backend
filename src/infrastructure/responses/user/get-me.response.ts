import { ApiProperty } from '@nestjs/swagger';
import { RoleModel } from '@app/domain/models';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMeResponse {
    @ApiProperty({ example: 1, description: 'Идентификатор пользователя' })
    declare id: number;

    @ApiProperty({
        example: 'test@mail.com',
        description: 'Электронная почта пользователя',
    })
    declare email: string;

    @ApiProperty({
        example: '+79991234567',
        description: 'Номер телефона пользователя',
        nullable: true,
    })
    declare phone?: string;

    @ApiProperty({ type: () => [RoleModel] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleModel)
    declare roles: RoleModel[];
}
