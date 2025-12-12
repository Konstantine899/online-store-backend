import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsNotEmpty,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * DTO для отзыва разрешения у роли
 *
 * @example
 * {
 *   "roleId": 5,
 *   "resource": "products",
 *   "action": "delete"
 * }
 */
export class RevokePermissionDto {
    @ApiProperty({
        description: 'ID роли, у которой отзывается разрешение',
        example: 5,
        type: Number,
    })
    @IsInt({ message: 'roleId должен быть целым числом' })
    @IsPositive({ message: 'roleId должен быть положительным числом' })
    declare readonly roleId: number;

    @ApiProperty({
        description: 'Ресурс для доступа',
        example: 'products',
        maxLength: 100,
        type: String,
    })
    @IsString({ message: 'resource должен быть строкой' })
    @IsNotEmpty({ message: 'resource не может быть пустым' })
    @MaxLength(100, {
        message: 'resource не может быть длиннее 100 символов',
    })
    declare readonly resource: string;

    @ApiProperty({
        description: 'Действие над ресурсом',
        example: 'delete',
        maxLength: 50,
        type: String,
    })
    @IsString({ message: 'action должен быть строкой' })
    @IsNotEmpty({ message: 'action не может быть пустым' })
    @MaxLength(50, { message: 'action не может быть длиннее 50 символов' })
    declare readonly action: string;
}
